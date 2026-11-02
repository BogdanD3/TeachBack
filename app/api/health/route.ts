import { db } from "@/lib/db";
import { aiEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Uptime check: { ok, db, ai }. No secrets, no model names. 503 when the database doesn't answer. */
export async function GET() {
  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    console.error("[health] database check failed");
  }
  const ai = aiEnv.demoMode || !aiEnv.apiKey ? "demo" : "configured";
  return Response.json({ ok: dbOk, db: dbOk, ai }, { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
