import { Prisma } from "@prisma/client";
import { z } from "zod";
import { apiError, botGuard, json, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  topic: z.string().trim().min(1).max(80),
  stars: z.coerce.number().int().min(1, "Pick 1 to 5 stars.").max(5, "Pick 1 to 5 stars."),
  text: z.string().trim().min(10, "Write at least 10 characters.").max(1000),
});

export async function POST(req: Request) {
  const blocked = await botGuard(req, "post_review");
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Log in to write a review.");

  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const topic = await db.topic.findUnique({ where: { slug: data.topic } });
  if (!topic) return apiError(404, "not_found", "Topic not found.");

  try {
    await db.review.create({ data: { topicId: topic.id, userId: user.id, stars: data.stars, text: data.text } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return apiError(409, "already_reviewed", "You already reviewed this topic.");
    throw e;
  }
  const agg = await db.review.aggregate({ where: { topicId: topic.id }, _avg: { stars: true }, _count: true });
  await db.topic.update({ where: { id: topic.id }, data: { rating: Math.round((agg._avg.stars ?? 0) * 10) / 10, ratingCount: agg._count } });
  return json({ ok: true }, 201);
}
