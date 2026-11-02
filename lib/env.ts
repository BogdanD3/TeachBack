// Server-side environment access. Never import this from a client component.

export const DEFAULT_MODEL = "gemini-3.6-flash";
export const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash";

export const aiEnv = {
  get apiKey(): string {
    return process.env.GEMINI_API_KEY?.trim() ?? "";
  },
  get model(): string {
    return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  },
  get fallbackModel(): string {
    return process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_FALLBACK_MODEL;
  },
  get demoMode(): boolean {
    return process.env.DEMO_MODE?.trim().toLowerCase() === "true";
  },
  /** How hard Pip thinks before replying: off | low | medium (default low). */
  get pipThinking(): ThinkingSetting {
    const v = process.env.PIP_THINKING?.trim().toLowerCase();
    return v === "off" || v === "medium" ? v : "low";
  },
};

export type ThinkingSetting = "off" | "low" | "medium";

const DEV_SESSION_SECRET = "teachback-dev-only-secret-do-not-use-in-production";
let warned = false;

export const MIN_SECRET_LENGTH = 32;

/**
 * Settings the server refuses to start without in production (checked in instrumentation.ts).
 * Returns human-readable problems; never includes secret values.
 */
export function productionConfigProblems(): string[] {
  const problems: string[] = [];
  const secret = process.env.SESSION_SECRET?.trim() ?? "";
  if (!secret) problems.push("SESSION_SECRET is not set. Add it to .env (e.g. `openssl rand -hex 32`).");
  else if (secret.length < MIN_SECRET_LENGTH) problems.push(`SESSION_SECRET is too short (${secret.length} characters, need at least ${MIN_SECRET_LENGTH}). Use \`openssl rand -hex 32\`.`);
  const demo = process.env.DEMO_MODE?.trim().toLowerCase();
  if (demo !== "true" && demo !== "false") problems.push("DEMO_MODE must be set to true or false in .env, so demo mode is always a deliberate choice.");
  return problems;
}

/** SESSION_SECRET: required (≥ 32 chars) in production, falls back to a fixed dev value otherwise. */
export function sessionSecret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    const problem = productionConfigProblems().find((p) => p.startsWith("SESSION_SECRET"));
    if (problem) throw new Error(problem);
  }
  if (value) return value;
  if (!warned) {
    warned = true;
    console.warn("[env] SESSION_SECRET is not set — using a dev-only fallback. Never do this in production.");
  }
  return DEV_SESSION_SECRET;
}
