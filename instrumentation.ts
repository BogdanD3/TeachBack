// Runs once when the Next.js server starts.
export async function register() {
  // Decision (PLAN.md): in production the server refuses to start with an unsafe config
  // (SESSION_SECRET missing or < 32 chars, DEMO_MODE unset) instead of failing later. Skipped during `next build`.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { productionConfigProblems } = await import("./lib/env");
    const problems = productionConfigProblems();
    if (problems.length) {
      for (const p of problems) console.error(`[startup] ${p}`);
      process.exit(1); // Next would otherwise keep running without serving pages
    }
  }
}
