// The single place that talks to Gemini. Server-only.
import type { Content } from "@google/genai";
import {
  evaluationSchema,
  lessonSchema,
  primerSchema,
  type ChatTurn,
  type Evaluation,
  type LessonContent,
  type PipResult,
  type PrimerContent,
  type PrimerDepth,
  type TopicContext,
} from "./ai-types";
import { demoPrimer } from "./demo-primers";
import { demoEvaluation, demoLesson, demoPipReply } from "./demo-responses";
import { aiEnv, type ThinkingSetting } from "./env";
import { AiUnavailableError, generate, generateStream } from "./gemini";
import { evaluationPrompt, lessonPrompt, pipSystemPrompt, primerPrompt, transcribePrompt } from "./prompts";

export class AiFormatError extends Error {
  constructor() {
    super("The AI returned an answer we couldn't read. Please try again.");
    this.name = "AiFormatError";
  }
}

const COVERED_RE = /<covered>([\s\S]*?)<\/covered>/i;
const CONFUSED_RE = /confus|don'?t (get|understand)|lost me|i'?m lost|wait[,.!?]|huh|what (does|do|is) .{1,40} mean|so .{3,80}\?$/i;

/** Map names Pip reported to exact concept names (case/whitespace-insensitive). */
function normalizeCovered(raw: string[], concepts: string[]): string[] {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const byNorm = new Map(concepts.map((c) => [norm(c), c]));
  return [...new Set(raw.map((r) => byNorm.get(norm(r))).filter((c): c is string => Boolean(c)))];
}

/** Strip the hidden <covered> tag (also an unterminated one) and return the parsed list. */
export function parsePipText(text: string, concepts: string[]): { reply: string; covered: string[] } {
  const m = text.match(COVERED_RE);
  const covered = m ? normalizeCovered(m[1].split("|"), concepts) : [];
  const reply = text.replace(COVERED_RE, "").replace(/<covered>[\s\S]*$/i, "").trim();
  return { reply, covered };
}

const isConfused = (reply: string) => CONFUSED_RE.test(reply);

function toContents(history: ChatTurn[]): Content[] {
  const turns = [...history];
  // Gemini wants the conversation to start with a user turn; Pip's fixed opening is dropped.
  while (turns[0]?.role === "pip") turns.shift();
  return turns.map((t) => ({ role: t.role === "teacher" ? "user" : "model", parts: [{ text: t.content }] }));
}

/**
 * Visible part of a partially streamed Pip reply: everything before the hidden <covered> tag,
 * also holding back a trailing "<cov…" that might be the start of it.
 */
export function visiblePipText(full: string): string {
  const tag = "<covered";
  const idx = full.toLowerCase().indexOf(tag);
  if (idx >= 0) return full.slice(0, idx);
  for (let k = Math.min(tag.length - 1, full.length); k > 0; k--) {
    if (tag.startsWith(full.slice(-k).toLowerCase())) return full.slice(0, -k);
  }
  return full;
}

// Pip writes 1–3 sentences (~60–90 tokens) plus the <covered> tag (~40 tokens). Gemini counts
// thinking tokens against maxOutputTokens, so the cap grows with the thinking level.
const PIP_MAX_TOKENS: Record<ThinkingSetting, number> = { off: 400, low: 1200, medium: 2400 };
/** Evaluation, lessons and primers think moderately: better JSON, still well under the default (high). */
const JSON_THINKING: ThinkingSetting = "medium";
/** Demo answers are "streamed" word by word so they look like the real thing. */
const DEMO_WORD_MS = 35;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type PipStreamEvent = { type: "delta"; text: string } | { type: "done"; result: PipResult };

/**
 * Pip's reply as a stream of visible text deltas, ending with a `done` event that carries the
 * full parsed result (reply without the tag, covered concepts, confused flag).
 * Failure before the first token → fallback model → demo mode (inside generateStream / here).
 */
export async function* pipReplyStream(topic: TopicContext, history: ChatTurn[], alreadyCovered: string[] = []): AsyncGenerator<PipStreamEvent> {
  const names = topic.concepts.map((c) => c.name);
  let full = "";
  let sent = "";
  let model: string | undefined;
  try {
    const thinking = aiEnv.pipThinking;
    const stream = await generateStream(
      { system: pipSystemPrompt(topic.title, names), contents: toContents(history), thinking, maxOutputTokens: PIP_MAX_TOKENS[thinking] },
      "pip",
    );
    model = stream.model;
    try {
      for await (const chunk of stream.chunks) {
        full += chunk;
        const visible = visiblePipText(full);
        if (visible.length > sent.length) {
          yield { type: "delta", text: visible.slice(sent.length) };
          sent = visible;
        }
      }
    } catch (e) {
      // Already showing text: keep what arrived instead of swapping in a different answer.
      console.warn(`[ai] pip stream broke after ${sent.length} chars on ${model} (${e instanceof Error ? e.message : "error"})`);
    }
  } catch (e) {
    console.info(`[ai] pip served from demo mode (${e instanceof Error ? e.message : "error"})`);
  }

  const parsed = parsePipText(full, names);
  if (parsed.reply) {
    const covered = [...new Set([...alreadyCovered, ...parsed.covered])];
    yield { type: "done", result: { reply: parsed.reply, covered, confused: isConfused(parsed.reply), source: "gemini", model } };
    return;
  }

  const demo = demoPipReply(topic, history, alreadyCovered);
  for (const piece of demo.reply.match(/\S+\s*/g) ?? []) {
    await sleep(DEMO_WORD_MS);
    yield { type: "delta", text: piece };
  }
  yield { type: "done", result: { ...demo, confused: isConfused(demo.reply), source: "demo" } };
}

/** Non-streaming convenience (scripts): collects the stream. */
export async function pipReply(topic: TopicContext, history: ChatTurn[], alreadyCovered: string[] = []): Promise<PipResult> {
  for await (const ev of pipReplyStream(topic, history, alreadyCovered)) {
    if (ev.type === "done") return ev.result;
  }
  throw new AiUnavailableError("Pip stream ended without a result");
}

/** Call the model for JSON, validate with zod, retry once on bad JSON. */
async function generateJson<T>(prompt: string, parse: (raw: unknown) => T | null, label: string): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { text } = await generate({ contents: prompt, json: true, thinking: JSON_THINKING }, label);
    try {
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      const result = parse(JSON.parse(cleaned));
      if (result) return result;
    } catch {
      /* fall through to retry */
    }
    console.warn(`[ai] ${label} returned invalid JSON (attempt ${attempt + 1})`);
  }
  throw new AiFormatError();
}

function transcriptOf(history: ChatTurn[]): string {
  return history.map((t) => `${t.role === "teacher" ? "Teacher" : "Pip"}: ${t.content}`).join("\n");
}

/** Evaluate a finished session. Every topic concept appears exactly once in the result. */
export async function evaluateSession(topic: TopicContext, history: ChatTurn[]): Promise<Evaluation & { source: "gemini" | "demo" }> {
  const names = topic.concepts.map((c) => c.name);
  try {
    const result = await generateJson(
      evaluationPrompt(topic.title, names, transcriptOf(history)),
      (raw) => {
        const p = evaluationSchema.safeParse(raw);
        if (!p.success) return null;
        const byName = new Map(p.data.concepts.map((c) => [normalizeCovered([c.name], names)[0], c]));
        const concepts = names.map(
          (name) => ({ ...(byName.get(name) ?? { state: "gap" as const, evidence: "", feedback: "Not covered in this session." }), name }),
        );
        return { concepts, pip_summary: p.data.pip_summary, score: concepts.filter((c) => c.state === "understood").length };
      },
      "evaluation",
    );
    return { ...result, source: "gemini" };
  } catch (e) {
    if (e instanceof AiFormatError) throw e;
    console.info(`[ai] evaluation served from demo mode (${e instanceof Error ? e.message : "error"})`);
    return { ...demoEvaluation(topic, history), source: "demo" };
  }
}

/** Primer for a topic. Every topic concept appears once, in topic order (missing ones are filled from the description). */
export async function generatePrimer(topic: TopicContext, depth: PrimerDepth): Promise<PrimerContent & { source: "gemini" | "demo" }> {
  const names = topic.concepts.map((c) => c.name);
  try {
    const primer = await generateJson(
      primerPrompt(topic.title, topic.concepts, depth),
      (raw) => {
        const p = primerSchema.safeParse(raw);
        if (!p.success) return null;
        const byName = new Map(p.data.concepts.map((c) => [normalizeCovered([c.name], names)[0], c]));
        if (byName.size < Math.ceil(names.length / 2)) return null; // mostly wrong names → retry
        const concepts = topic.concepts.map(
          (c) => ({ ...(byName.get(c.name) ?? { explanation: c.description, example: "", hint: c.description, deeper: "", mistake: "" }), name: c.name }),
        );
        return { ...p.data, concepts };
      },
      `primer-${depth}`,
    );
    return { ...primer, source: "gemini" };
  } catch (e) {
    if (e instanceof AiFormatError) throw e;
    console.info(`[ai] primer served from demo mode (${e instanceof Error ? e.message : "error"})`);
    return { ...demoPrimer(topic, depth), source: "demo" };
  }
}

/** Demo transcript: the first stage-demo message for Photosynthesis, the first concept's description otherwise. */
const DEMO_TRANSCRIPT = "Photosynthesis is how plants make their own food. Chlorophyll, the green pigment in leaves, captures light energy.";

/** Speech to text for the mic button. Main model → fallback → demo transcript. Minimal thinking: it's dictation. */
export async function transcribeAudio(topic: TopicContext, audio: { base64: string; mimeType: string }): Promise<{ text: string; source: "gemini" | "demo" }> {
  try {
    const { text } = await generate(
      {
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: audio.mimeType, data: audio.base64 } }, { text: transcribePrompt(topic.title) }] }],
        temperature: 0,
        thinking: "off",
      },
      "transcribe",
    );
    return { text: text.replace(/^"|"$/g, "").trim(), source: "gemini" };
  } catch (e) {
    console.info(`[ai] transcript served from demo mode (${e instanceof Error ? e.message : "error"})`);
    return { text: topic.slug === "photosynthesis" ? DEMO_TRANSCRIPT : (topic.concepts[0]?.description ?? ""), source: "demo" };
  }
}

export async function generateLesson(
  topic: TopicContext,
  concept: { name: string; evidence: string; feedback: string },
): Promise<LessonContent & { source: "gemini" | "demo" }> {
  try {
    const lesson = await generateJson(
      lessonPrompt(topic.title, concept.name, concept.evidence || "(nothing — the concept was not covered)", concept.feedback),
      (raw) => {
        const p = lessonSchema.safeParse(raw);
        if (!p.success) return null;
        // Drop questions whose correct_index is out of range.
        const questions = p.data.questions.filter((q) => q.correct_index < q.options.length).slice(0, 2);
        return questions.length ? { ...p.data, questions } : null;
      },
      "lesson",
    );
    return { ...lesson, source: "gemini" };
  } catch (e) {
    if (e instanceof AiFormatError) throw e;
    console.info(`[ai] lesson served from demo mode (${e instanceof Error ? e.message : "error"})`);
    return { ...demoLesson(topic, concept.name, concept.feedback), source: "demo" };
  }
}
