// npm run ai:check — sends one tiny prompt to GEMINI_MODEL, then GEMINI_FALLBACK_MODEL,
// and prints which one answered. Loads .env via `node --env-file-if-exists=.env`. Never prints the key.
import { GoogleGenAI, ApiError, ThinkingLevel } from "@google/genai";
import { aiEnv } from "../lib/env";
import { healthCheckPrompt } from "../lib/prompts";

async function main() {
  if (!aiEnv.apiKey) {
    console.log("GEMINI_API_KEY is not set → the app will run in demo mode.");
    process.exit(1);
  }
  console.log(`DEMO_MODE=${aiEnv.demoMode}  (if true, the app ignores the API and uses canned answers)`);
  const ai = new GoogleGenAI({ apiKey: aiEnv.apiKey, httpOptions: { timeout: 20_000 } });
  let anyOk = false;
  for (const [label, model] of [["main", aiEnv.model], ["fallback", aiEnv.fallbackModel]] as const) {
    const t0 = Date.now();
    try {
      const res = await ai.models.generateContent({ model, contents: healthCheckPrompt });
      console.log(`✔ ${label} ${model} answered in ${Date.now() - t0} ms: ${JSON.stringify(res.text?.trim().slice(0, 40))}`);
      anyOk = true;
      // Streaming timing with Pip's settings (PIP_THINKING), the number that matters for the chat.
      const level = { off: ThinkingLevel.MINIMAL, low: ThinkingLevel.LOW, medium: ThinkingLevel.MEDIUM }[aiEnv.pipThinking];
      const t1 = Date.now();
      let first = 0;
      const stream = await ai.models.generateContentStream({
        model,
        contents: "Explain in two short sentences why the sky is blue, like a curious 10-year-old asking a question back.",
        config: { thinkingConfig: { thinkingLevel: level }, maxOutputTokens: 1200 },
      });
      for await (const c of stream) if (!first && c.text) first = Date.now() - t1;
      console.log(`  stream (PIP_THINKING=${aiEnv.pipThinking}): first words ${first} ms, done ${Date.now() - t1} ms`);
    } catch (e) {
      const why = e instanceof ApiError ? `HTTP ${e.status}: ${e.message.slice(0, 160)}` : e instanceof Error ? e.message : String(e);
      console.log(`✘ ${label} ${model} failed after ${Date.now() - t0} ms — ${why}`);
    }
  }
  process.exit(anyOk ? 0 : 1);
}

main();
