import { z } from "zod";
import { apiError, botGuard, json, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  title: z.string().trim().min(8, "Give your thread a title of at least 8 characters.").max(140),
  body: z.string().trim().min(20, "Write at least 20 characters so others can help.").max(5000),
  topic: z.string().trim().max(80).optional().nullable(),
});

export async function POST(req: Request) {
  const blocked = await botGuard(req, "post_forum");
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Log in to start a thread.");
  if (!rateLimit(`forum:${user.id}`, 5, 60_000).ok) return apiError(429, "rate_limited", "You're posting very fast. Wait a minute.");

  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const topic = data.topic ? await db.topic.findUnique({ where: { slug: data.topic } }) : null;
  const thread = await db.thread.create({ data: { title: data.title, body: data.body, userId: user.id, topicId: topic?.id ?? null } });
  return json({ ok: true, id: thread.id, redirect: `/community/${thread.id}` }, 201);
}
