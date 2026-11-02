// Runs once when the Next.js server starts.
export async function register() {
  // Decision (PLAN.md): in production a missing SESSION_SECRET must stop the server at startup,
  // not on the first login. Skipped during `next build`.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { sessionSecret } = await import("./lib/env");
    try {
      sessionSecret(); // throws if missing
    } catch (e) {
      console.error(`[startup] ${e instanceof Error ? e.message : e}`);
      process.exit(1); // Next would otherwise keep running without serving pages
    }
  }
}
