// Low-level Gemini access with retry + fallback. Only lib/ai.ts and scripts/ai-check.ts use this.
import { ApiError, GoogleGenAI, type Content } from "@google/genai";
import { aiEnv } from "./env";

export class AiUnavailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "AiUnavailableError";
  }
}

type Request = {
  system?: string;
  contents: Content[] | string;
  json?: boolean;
  temperature?: number;
};

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  // The SDK sends the key in the x-goog-api-key header.
  client ??= new GoogleGenAI({ apiKey: aiEnv.apiKey, httpOptions: { timeout: 20_000 } });
  return client;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isBusy = (e: unknown) => e instanceof ApiError && (e.status === 503 || e.status === 429);
const describe = (e: unknown) => (e instanceof ApiError ? `HTTP ${e.status}` : e instanceof Error ? e.name : "unknown error");

async function callModel(model: string, req: Request): Promise<string> {
  const res = await getClient().models.generateContent({
    model,
    contents: req.contents,
    config: {
      systemInstruction: req.system,
      temperature: req.temperature ?? (req.json ? 0.3 : 0.8),
      ...(req.json ? { responseMimeType: "application/json" } : {}),
    },
  });
  const text = res.text?.trim();
  if (!text) throw new Error("Empty response");
  return text;
}

/**
 * Generate text. Order: main model → (on 503/429: wait ~1s, retry once) → fallback model
 * (same retry rule) → throw AiUnavailableError so the caller can use demo mode.
 * Logs which model answered; never logs the key.
 */
export async function generate(req: Request, label = "ai"): Promise<{ text: string; model: string }> {
  if (aiEnv.demoMode) throw new AiUnavailableError("DEMO_MODE=true");
  if (!aiEnv.apiKey) throw new AiUnavailableError("GEMINI_API_KEY not set");

  const models = [...new Set([aiEnv.model, aiEnv.fallbackModel])];
  let lastError = "";
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await callModel(model, req);
        console.info(`[ai] ${label} answered by ${model}`);
        return { text, model };
      } catch (e) {
        lastError = `${model}: ${describe(e)}`;
        console.warn(`[ai] ${label} failed on ${lastError}`);
        if (attempt === 0 && isBusy(e)) {
          await sleep(1000);
          continue;
        }
        break; // non-retryable or second failure → next model
      }
    }
  }
  throw new AiUnavailableError(`All models failed (${lastError})`);
}
