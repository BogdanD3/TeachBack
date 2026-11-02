// The user's existing lessons, for the dashboard and topic pages. Server-only.
import { db } from "./db";

export type LessonLink = { href: string; title: string; concept: string; topic: string; state: string; createdAt: Date };

function titleOf(content: string, fallback: string): string {
  try {
    const t = (JSON.parse(content) as { title?: unknown }).title;
    return typeof t === "string" && t.trim() ? t : fallback;
  } catch {
    return fallback;
  }
}

/** Most recent lessons first; links go to /lesson/[conceptStateId] (cached, so opening them is instant). */
export async function userLessons(userId: string, opts: { topicId?: string; take?: number } = {}): Promise<LessonLink[]> {
  const rows = await db.lesson.findMany({
    where: { userId, ...(opts.topicId ? { concept: { topicId: opts.topicId } } : {}) },
    include: { concept: { include: { topic: { select: { title: true } } } }, conceptState: { select: { state: true } } },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 6,
  });
  return rows.map((l) => ({
    href: `/lesson/${l.conceptStateId}`,
    title: titleOf(l.content, l.concept.name),
    concept: l.concept.name,
    topic: l.concept.topic.title,
    state: l.conceptState.state,
    createdAt: l.createdAt,
  }));
}
