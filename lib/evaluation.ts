// Turn an evaluation into ConceptStates, points and a finished session.
import type { Evaluation } from "./ai-types";
import { db } from "./db";
import { awardPoints, POINTS, touchStreak } from "./points";
import type { TopicWithConcepts } from "./topics";

export type StoredEvaluation = Evaluation & { source: "gemini" | "demo"; pointsAwarded: number; gapsClosed: string[] };

export async function saveEvaluation(sessionId: string, userId: string, topic: TopicWithConcepts, ev: Evaluation & { source: "gemini" | "demo" }) {
  const byName = new Map(topic.concepts.map((c) => [c.name, c]));
  const previous = await db.conceptState.findMany({ where: { userId, conceptId: { in: topic.concepts.map((c) => c.id) } } });
  const prevByConcept = new Map(previous.map((p) => [p.conceptId, p.state]));

  const gapsClosed: string[] = [];
  for (const c of ev.concepts) {
    const concept = byName.get(c.name);
    if (!concept) continue;
    const before = prevByConcept.get(concept.id);
    if ((before === "gap" || before === "shaky") && c.state === "understood") gapsClosed.push(c.name);
    await db.conceptState.upsert({
      where: { userId_conceptId: { userId, conceptId: concept.id } },
      create: { userId, conceptId: concept.id, teachSessionId: sessionId, state: c.state, evidence: c.evidence, feedback: c.feedback },
      update: { teachSessionId: sessionId, state: c.state, evidence: c.evidence, feedback: c.feedback },
    });
  }

  const pointsAwarded = POINTS.sessionFinished + gapsClosed.length * POINTS.gapClosed;
  await awardPoints(userId, POINTS.sessionFinished, "session_finished");
  if (gapsClosed.length) await awardPoints(userId, gapsClosed.length * POINTS.gapClosed, "gap_closed");
  await touchStreak(userId);

  const stored: StoredEvaluation = { ...ev, pointsAwarded, gapsClosed };
  await db.teachSession.update({
    where: { id: sessionId },
    data: { status: "finished", finishedAt: new Date(), score: ev.score, pipSummary: ev.pip_summary, evaluation: JSON.stringify(stored) },
  });
  return stored;
}

export function readEvaluation(raw: string | null): StoredEvaluation | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredEvaluation;
  } catch {
    return null;
  }
}
