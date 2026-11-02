import { db } from "./db";

export const POINTS = { sessionFinished: 50, gapClosed: 30, referral: 20 } as const;

export async function awardPoints(userId: string, amount: number, reason: string): Promise<void> {
  if (amount <= 0) return;
  await db.$transaction([
    db.pointEvent.create({ data: { userId, amount, reason } }),
    db.user.update({ where: { id: userId }, data: { points: { increment: amount } } }),
  ]);
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Streak: +1 if last active yesterday, unchanged if today, reset to 1 otherwise. */
export async function touchStreak(userId: string): Promise<number> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { streak: true, lastActiveAt: true } });
  const now = new Date();
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const last = user.lastActiveAt ? dayKey(user.lastActiveAt) : null;
  const streak = last === today ? Math.max(1, user.streak) : last === yesterday ? user.streak + 1 : 1;
  await db.user.update({ where: { id: userId }, data: { streak, lastActiveAt: now } });
  return streak;
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
