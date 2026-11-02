import type { Concept, Topic } from "@prisma/client";
import type { TopicContext } from "./ai-types";
import { db } from "./db";

export type TopicWithConcepts = Topic & { concepts: Concept[] };

export const SUBJECTS = ["Biology", "Computer science", "Economics", "Physics", "History", "Finance", "Earth science"] as const;

export async function findTopic(idOrSlug: string): Promise<TopicWithConcepts | null> {
  return db.topic.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: { concepts: { orderBy: { order: "asc" } } },
  });
}

export function toTopicContext(t: TopicWithConcepts): TopicContext {
  return { slug: t.slug, title: t.title, concepts: t.concepts.map((c) => ({ name: c.name, description: c.description })) };
}

/** Concept states of one user keyed by conceptId. */
export async function userConceptStates(userId: string | undefined, conceptIds: string[]) {
  if (!userId || conceptIds.length === 0) return new Map<string, { id: string; state: string }>();
  const rows = await db.conceptState.findMany({ where: { userId, conceptId: { in: conceptIds } }, select: { id: true, conceptId: true, state: true } });
  return new Map(rows.map((r) => [r.conceptId, { id: r.id, state: r.state }]));
}

export const splitCovered = (s: string) => s.split("|").map((x) => x.trim()).filter(Boolean);
