import type { PromoCode } from "@prisma/client";
import { db } from "./db";

export type PromoCheck = { ok: true; promo: PromoCode } | { ok: false; message: string };

export async function checkPromo(code: string): Promise<PromoCheck> {
  const promo = await db.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!promo) return { ok: false, message: "That code doesn't exist. Check the spelling." };
  if (promo.expiresAt && promo.expiresAt < new Date()) return { ok: false, message: "That code has expired." };
  if (promo.uses >= promo.maxUses) return { ok: false, message: "That code has been used up." };
  return { ok: true, promo };
}
