import { AiFormatError, evaluateSession } from "@/lib/ai";
import { apiError, botGuard, json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveEvaluation } from "@/lib/evaluation";
import { aiRateLimit } from "@/lib/rate-limit";
import { findTopic } from "@/lib/topics";

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  // Finishing calls the AI and submits points to the leaderboard: both BotLens actions apply.
  const blocked = (await botGuard(req, "ai_message")) ?? (await botGuard(req, "leaderboard_submit"));
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Please log in again.");

  const { sessionId } = await params;
  const session = await db.teachSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!session || session.userId !== user.id) return apiError(404, "not_found", "This session doesn't exist.");
  const redirect = `/report/${session.id}`;
  if (session.status === "finished") return json({ ok: true, redirect });
  if (!session.messages.some((m) => m.role === "teacher")) return apiError(400, "empty", "Explain at least one thing to Pip before finishing.");

  const rl = aiRateLimit(user.id);
  if (!rl.ok) return apiError(429, "rate_limited", `Too many requests. Try again in ${rl.retryAfterSec}s.`);

  // Claim the session so a double click can't evaluate twice.
  const claimed = await db.teachSession.updateMany({ where: { id: session.id, status: "active" }, data: { status: "evaluating" } });
  if (claimed.count === 0) return apiError(409, "busy", "Your report is already being written.");

  const topic = await findTopic(session.topicId);
  if (!topic) return apiError(404, "not_found", "Topic not found.");
  try {
    const ev = await evaluateSession(
      { slug: topic.slug, title: topic.title, concepts: topic.concepts.map((c) => ({ name: c.name, description: c.description })) },
      session.messages.map((m) => ({ role: m.role as "teacher" | "pip", content: m.content })),
    );
    await saveEvaluation(session.id, user.id, topic, ev);
    return json({ ok: true, redirect });
  } catch (e) {
    await db.teachSession.update({ where: { id: session.id }, data: { status: "active" } });
    if (e instanceof AiFormatError) return apiError(502, "ai_format", e.message);
    console.error("[finish] failed", e);
    return apiError(500, "error", "We couldn't write your report. Try again.");
  }
}
