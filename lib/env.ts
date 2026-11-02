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

/** SESSION_SECRET: required in production, falls back to a fixed dev value otherwise. */
export function sessionSecret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is not set. Add it to .env before starting in production.");
  }
  if (!warned) {
    warned = true;
    console.warn("[env] SESSION_SECRET is not set — using a dev-only fallback. Never do this in production.");
  }
  return DEV_SESSION_SECRET;
}
