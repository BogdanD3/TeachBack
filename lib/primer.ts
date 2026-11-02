// Primers (learn before teaching) and the Peek hint taken from them. Server-only.
import { AiFormatError, generatePrimer } from "./ai";
import { primerSchema, type PrimerContent, type PrimerDepth } from "./ai-types";
import { db } from "./db";
import { demoPrimer } from "./demo-primers";
import { aiRateLimit } from "./rate-limit";
import { toTopicContext, type TopicWithConcepts } from "./topics";

export const PEEK_COST = 5;

function parse(raw: string): PrimerContent | null {
  try {
    const p = primerSchema.safeParse(JSON.parse(raw));
    return p.success ? p.data : null;
  } catch {
    return null;
  }
}

export type PrimerResult = { primer: PrimerContent; source: "gemini" | "demo" } | { primer: null; failure: string };

/**
 * Cached primer, or generate one. Only real Gemini primers are cached: a demo primer (API down)
 * is rebuilt per request for free, so the real one is written as soon as the API is back.
 */
export async function getPrimer(topic: TopicWithConcepts, depth: PrimerDepth, rateKey: string): Promise<PrimerResult> {
  const row = await db.primer.findUnique({ where: { topicId_depth: { topicId: topic.id, depth } } });
  const cached = row && parse(row.content);
  if (cached) return { primer: cached, source: "gemini" };

  if (!aiRateLimit(rateKey).ok) return { primer: null, failure: "Lots of primers requested in a minute. Wait a moment and reload." };
  try {
    const { source, ...primer } = await generatePrimer(toTopicContext(topic), depth);
    if (source === "gemini") {
      const content = JSON.stringify(primer);
      await db.primer.upsert({ where: { topicId_depth: { topicId: topic.id, depth } }, create: { topicId: topic.id, depth, content, source }, update: { content, source } });
    }
    return { primer, source };
  } catch (e) {
    return { primer: null, failure: e instanceof AiFormatError ? e.message : "We couldn't write this primer right now. Try again in a moment." };
  }
}

/** Reading time at ~200 words per minute. */
export function readMinutes(p: PrimerContent): number {
  const text = [p.intro, p.recap, ...p.concepts.flatMap((c) => [c.explanation, c.example, c.deeper, c.mistake])].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));
}

/**
 * The concept Pip is most likely asking about: the uncovered concept whose name shares the most
 * words with Pip's last message; ties (or no overlap) → the first uncovered concept in topic order.
 */
const STOPWORDS = new Set(
  "about after again also because been before being does doing done each from have here into just like made make many more most much only other over same some such than that their them then there these they thing this those through very what when where which while with would your comes come goes works".split(" "),
);

export function pickPeekConcept(concepts: string[], covered: string[], lastPip: string): string {
  const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const said = new Set(words(lastPip));
  const open = concepts.filter((c) => !covered.includes(c));
  const pool = open.length ? open : concepts;
  let best = pool[0];
  let bestScore = 0;
  for (const c of pool) {
    const score = words(c).filter((w) => said.has(w) || said.has(w.replace(/s$/, ""))).length;
    if (score > bestScore) [best, bestScore] = [c, score];
  }
  return best;
}

/** Peek hint for one concept from a cached primer (any depth); no AI call. Falls back to the demo primer / description. */
export async function peekHint(topic: TopicWithConcepts, conceptName: string): Promise<string> {
  const rows = await db.primer.findMany({ where: { topicId: topic.id }, orderBy: { depth: "desc" } }); // quick before full
  for (const r of rows) {
    const hint = parse(r.content)?.concepts.find((c) => c.name === conceptName)?.hint;
    if (hint) return hint;
  }
  return demoPrimer(toTopicContext(topic), "quick").concepts.find((c) => c.name === conceptName)?.hint ?? topic.concepts.find((c) => c.name === conceptName)?.description ?? "";
}
