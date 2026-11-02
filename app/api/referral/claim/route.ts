import { apiError, botGuard, json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardPoints, POINTS } from "@/lib/points";

const WEEK = 7 * 86_400_000;

/** Claim one free week for every friend who signed up with your link and hasn't been claimed yet. */
export async function POST(req: Request) {
  const blocked = await botGuard(req, "referral_claim");
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Log in to claim your reward.");

  const pending = await db.user.findMany({ where: { referredById: user.id, referralClaimed: false }, select: { id: true } });
  if (pending.length === 0) return apiError(409, "nothing_to_claim", "No new friends to claim for yet.");

  // Mark first so a double click can't claim twice.
  const marked = await db.user.updateMany({ where: { id: { in: pending.map((p) => p.id) }, referralClaimed: false }, data: { referralClaimed: true } });
  const weeks = marked.count;
  if (weeks === 0) return apiError(409, "nothing_to_claim", "Already claimed.");

  const base = user.plan === "trial" && user.trialEndsAt && user.trialEndsAt > new Date() ? user.trialEndsAt.getTime() : Date.now();
  await db.user.update({
    where: { id: user.id },
    data: { bonusDays: { increment: weeks * 7 }, ...(user.plan === "trial" || user.plan === "free" ? { plan: "trial", trialEndsAt: new Date(base + weeks * WEEK) } : {}) },
  });
  await awardPoints(user.id, weeks * POINTS.referral, "referral");
  return json({ ok: true, weeks });
}
