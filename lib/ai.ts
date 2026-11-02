// The single place that talks to Gemini. Server-only.
import type { Content } from "@google/genai";
import { evaluationSchema, lessonSchema, type ChatTurn, type Evaluation, type LessonContent, type PipResult, type TopicContext } from "./ai-types";
import { demoEvaluation, demoLesson, demoPipReply } from "./demo-responses";
import { AiUnavailableError, generate } from "./gemini";
import { evaluationPrompt, lessonPrompt, pipSystemPrompt } from "./prompts";

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

export async function pipReply(topic: TopicContext, history: ChatTurn[], alreadyCovered: string[] = []): Promise<PipResult> {
  const names = topic.concepts.map((c) => c.name);
  try {
    const { text, model } = await generate({ system: pipSystemPrompt(topic.title, names), contents: toContents(history) }, "pip");
    const { reply, covered } = parsePipText(text, names);
    if (!reply) throw new AiUnavailableError("Empty Pip reply");
    return { reply, covered: [...new Set([...alreadyCovered, ...covered])], confused: isConfused(reply), source: "gemini", model };
  } catch (e) {
    console.info(`[ai] pip served from demo mode (${e instanceof Error ? e.message : "error"})`);
    const demo = demoPipReply(topic, history, alreadyCovered);
    return { ...demo, confused: isConfused(demo.reply), source: "demo" };
  }
}

/** Call the model for JSON, validate with zod, retry once on bad JSON. */
async function generateJson<T>(prompt: string, parse: (raw: unknown) => T | null, label: string): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { text } = await generate({ contents: prompt, json: true }, label);
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
