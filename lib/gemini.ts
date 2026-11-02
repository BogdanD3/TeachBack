// Low-level Gemini access with retry + fallback. Only lib/ai.ts and scripts/ai-check.ts use this.
import { ApiError, GoogleGenAI, ThinkingLevel, type Content, type GenerateContentConfig, type GenerateContentResponse } from "@google/genai";
import { aiEnv, type ThinkingSetting } from "./env";

export class AiUnavailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "AiUnavailableError";
  }
}

export type GenerateRequest = {
  system?: string;
  contents: Content[] | string;
  json?: boolean;
  temperature?: number;
  /** Gemini 3 models take a thinking level; "off" maps to MINIMAL (the lowest Flash allows). */
  thinking?: ThinkingSetting;
  maxOutputTokens?: number;
};

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  // The SDK sends the key in the x-goog-api-key header.
  client ??= new GoogleGenAI({ apiKey: aiEnv.apiKey, httpOptions: { timeout: 30_000 } });
  return client;
}

const LEVELS: Record<ThinkingSetting, ThinkingLevel> = { off: ThinkingLevel.MINIMAL, low: ThinkingLevel.LOW, medium: ThinkingLevel.MEDIUM };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isBusy = (e: unknown) => e instanceof ApiError && (e.status === 503 || e.status === 429);
const isBadRequest = (e: unknown) => e instanceof ApiError && e.status === 400;
const describe = (e: unknown) => (e instanceof ApiError ? `HTTP ${e.status}` : e instanceof Error ? e.message || e.name : "unknown error");

function configFor(req: GenerateRequest, withThinking: boolean): GenerateContentConfig {
  return {
    systemInstruction: req.system,
    temperature: req.temperature ?? (req.json ? 0.3 : 0.8),
    ...(req.json ? { responseMimeType: "application/json" } : {}),
    ...(req.maxOutputTokens ? { maxOutputTokens: req.maxOutputTokens } : {}),
    ...(withThinking && req.thinking ? { thinkingConfig: { thinkingLevel: LEVELS[req.thinking] } } : {}),
  };
}

/** Text of a response/chunk without thought parts. */
function textOf(res: GenerateContentResponse): string {
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  return parts.filter((p) => !p.thought && typeof p.text === "string").map((p) => p.text).join("");
}

/**
 * Runs `attempt(model, withThinking)` with the shared failure rules:
 * main model → (503/429: wait ~1s, retry once) → fallback model (same rule) → AiUnavailableError.
 * A 400 while a thinking level is set retries the same model once without it (older models reject it).
 */
async function withFallback<T>(req: GenerateRequest, label: string, attempt: (model: string, withThinking: boolean) => Promise<T>): Promise<T> {
  if (aiEnv.demoMode) throw new AiUnavailableError("DEMO_MODE=true");
  if (!aiEnv.apiKey) throw new AiUnavailableError("GEMINI_API_KEY not set");

  const models = [...new Set([aiEnv.model, aiEnv.fallbackModel])];
  let lastError = "";
  for (const model of models) {
    let withThinking = Boolean(req.thinking);
    for (let tries = 0; tries < 3; tries++) {
      try {
        return await attempt(model, withThinking);
      } catch (e) {
        lastError = `${model}: ${describe(e)}`;
        console.warn(`[ai] ${label} failed on ${lastError}`);
        if (withThinking && isBadRequest(e)) {
          withThinking = false;
          continue;
        }
        if (tries === 0 && isBusy(e)) {
          await sleep(1000);
          continue;
        }
        break; // non-retryable or second failure → next model
      }
    }
  }
  throw new AiUnavailableError(`All models failed (${lastError})`);
}

/** Generate a complete answer. Logs which model answered and how long it took; never logs the key. */
export async function generate(req: GenerateRequest, label = "ai"): Promise<{ text: string; model: string }> {
  return withFallback(req, label, async (model, withThinking) => {
    const t0 = Date.now();
    const res = await getClient().models.generateContent({ model, contents: req.contents, config: configFor(req, withThinking) });
    const text = textOf(res).trim();
    if (!text) throw new Error(`Empty response (${res.candidates?.[0]?.finishReason ?? "no candidate"})`);
    console.info(`[ai] ${label} answered by ${model} in ${Date.now() - t0}ms`);
    return { text, model };
  });
}

export type TextStream = { model: string; chunks: AsyncGenerator<string> };

/**
 * Stream an answer. The fallback rules apply until the first non-empty chunk arrives;
 * after that the caller owns the stream (a mid-stream failure is thrown from `chunks`).
 */
export async function generateStream(req: GenerateRequest, label = "ai"): Promise<TextStream> {
  return withFallback(req, label, async (model, withThinking) => {
    const t0 = Date.now();
    const it = await getClient().models.generateContentStream({ model, contents: req.contents, config: configFor(req, withThinking) });
    // Pull until the first visible text so failures before it can still switch models.
    let first = "";
    let finish = "";
    for (;;) {
      const r = await it.next();
      if (r.done) break;
      first = textOf(r.value);
      finish = r.value.candidates?.[0]?.finishReason ?? finish;
      if (first) break;
    }
    if (!first) throw new Error(`Empty response (${finish || "no candidate"})`);
    const ttft = Date.now() - t0;
    async function* chunks(): AsyncGenerator<string> {
      yield first;
      for await (const c of it) {
        const t = textOf(c);
        if (t) yield t;
      }
      console.info(`[ai] ${label} streamed by ${model}: first text ${ttft}ms, done ${Date.now() - t0}ms`);
    }
    return { model, chunks: chunks() };
  });
}
