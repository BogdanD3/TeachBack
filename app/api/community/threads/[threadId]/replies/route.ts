import { z } from "zod";
import { apiError, botGuard, json, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ body: z.string().trim().min(2, "Write a reply first.").max(3000) });

export async function POST(req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const blocked = await botGuard(req, "post_forum");
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Log in to reply.");
  if (!rateLimit(`forum:${user.id}`, 5, 60_000).ok) return apiError(429, "rate_limited", "You're posting very fast. Wait a minute.");

  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const { threadId } = await params;
  if (!(await db.thread.findUnique({ where: { id: threadId }, select: { id: true } }))) return apiError(404, "not_found", "This thread doesn't exist.");
  const reply = await db.reply.create({ data: { threadId, userId: user.id, body: data.body } });
  return json({ ok: true, id: reply.id }, 201);
}
