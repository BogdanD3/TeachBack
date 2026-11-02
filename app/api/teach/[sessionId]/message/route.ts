import { z } from "zod";
import { pipReply } from "@/lib/ai";
import { apiError, botGuard, json, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiRateLimit } from "@/lib/rate-limit";
import { findTopic, splitCovered, toTopicContext } from "@/lib/topics";

const schema = z.object({ content: z.string().trim().min(1, "Write something to Pip first.").max(2000, "Keep it under 2000 characters.") });

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const blocked = await botGuard(req, "ai_message");
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Please log in again.");

  const rl = aiRateLimit(user.id);
  if (!rl.ok) return apiError(429, "rate_limited", `Pip needs a breather. Try again in ${rl.retryAfterSec}s.`, { retryAfter: rl.retryAfterSec });

  const { data, error } = await parseBody(req, schema);
  if (error) return error;

  const { sessionId } = await params;
  const session = await db.teachSession.findUnique({ where: { id: sessionId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!session || session.userId !== user.id) return apiError(404, "not_found", "This session doesn't exist.");
  if (session.status !== "active") return apiError(409, "finished", "This session is already finished.");

  const topic = await findTopic(session.topicId);
  if (!topic) return apiError(404, "not_found", "Topic not found.");

  await db.message.create({ data: { teachSessionId: session.id, role: "teacher", content: data.content } });
  const history = [...session.messages.map((m) => ({ role: m.role as "teacher" | "pip", content: m.content })), { role: "teacher" as const, content: data.content }];

  const result = await pipReply(toTopicContext(topic), history, splitCovered(session.covered));
  const pipMsg = await db.message.create({ data: { teachSessionId: session.id, role: "pip", content: result.reply, confused: result.confused } });
  await db.teachSession.update({ where: { id: session.id }, data: { covered: result.covered.join("|") } });

  return json({ id: pipMsg.id, reply: result.reply, covered: result.covered, confused: result.confused, source: result.source });
}
