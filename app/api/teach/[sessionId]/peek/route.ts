import { z } from "zod";
import { apiError, json, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PEEK_COST, peekHint, pickPeekConcept } from "@/lib/primer";
import { findTopic, splitCovered } from "@/lib/topics";

const schema = z.object({}); // no input: the server decides which concept to hint at

/** Peek: a 1–2 sentence hint (from the primer, no AI call) about the concept Pip is asking about. 5 points, once per concept per session. */
export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Please log in again.");
  const { error } = await parseBody(req, schema);
  if (error) return error;

  const { sessionId } = await params;
  const session = await db.teachSession.findUnique({
    where: { id: sessionId },
    include: { messages: { where: { role: "pip" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!session || session.userId !== user.id) return apiError(404, "not_found", "This session doesn't exist.");
  if (session.status !== "active") return apiError(409, "finished", "This session is already finished.");
  const topic = await findTopic(session.topicId);
  if (!topic) return apiError(404, "not_found", "Topic not found.");

  const names = topic.concepts.map((c) => c.name);
  const concept = pickPeekConcept(names, splitCovered(session.covered), session.messages[0]?.content ?? "");
  const hint = await peekHint(topic, concept);
  const peeks = splitCovered(session.peeks);

  let cost = 0;
  if (!peeks.includes(concept)) {
    peeks.push(concept);
    cost = Math.min(PEEK_COST, user.points); // points never go below zero
    await db.$transaction([
      db.teachSession.update({ where: { id: session.id }, data: { peeks: peeks.join("|") } }),
      ...(cost > 0
        ? [db.pointEvent.create({ data: { userId: user.id, amount: -cost, reason: "peek" } }), db.user.update({ where: { id: user.id }, data: { points: { decrement: cost } } })]
        : []),
    ]);
  }
  return json({ concept, hint, cost, points: user.points - cost, peeks });
}
