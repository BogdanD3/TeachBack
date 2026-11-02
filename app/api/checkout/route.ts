import { z } from "zod";
import { apiError, botGuard, json, parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { cardSchema } from "@/lib/card";
import { db } from "@/lib/db";
import { discounted, findPlan } from "@/lib/plans";
import { checkPromo } from "@/lib/promo";

const schema = cardSchema.extend({
  plan: z.enum(["pro", "team"]),
  promo: z.string().trim().max(32).optional().nullable(),
});

/** Simulated payment: validates the card shape, never charges anything. */
export async function POST(req: Request) {
  const blocked = await botGuard(req, "checkout");
  if (blocked) return blocked;
  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Log in to check out.");

  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  const plan = findPlan(data.plan)!;

  let promo: { id: string; maxUses: number } | null = null;
  let amount = plan.priceCents;
  if (data.promo) {
    const res = await checkPromo(data.promo);
    if (!res.ok) return apiError(422, "invalid_promo", res.message, { fields: { code: res.message } });
    promo = res.promo;
    amount = discounted(plan.priceCents, res.promo.percentOff);
  }

  if (promo) {
    // Count the use only while uses are left (guards against a race on the last use).
    const used = await db.promoCode.updateMany({ where: { id: promo.id, uses: { lt: promo.maxUses } }, data: { uses: { increment: 1 } } });
    if (used.count === 0) return apiError(422, "invalid_promo", "That code has just been used up.", { fields: { code: "That code has just been used up." } });
  }
  const [order] = await db.$transaction([
    db.order.create({ data: { userId: user.id, plan: plan.id, amountCents: amount, promoCodeId: promo?.id ?? null, cardLast4: data.cardNumber.slice(-4) } }),
    db.user.update({ where: { id: user.id }, data: { plan: plan.id, trialEndsAt: null } }),
  ]);
  return json({ ok: true, redirect: `/checkout/success?order=${order.id}` }, 201);
}
