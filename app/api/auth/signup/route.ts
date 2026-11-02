import { z } from "zod";
import { apiError, botGuard, json, parseBody } from "@/lib/api";
import { createSession, hashPassword, newReferralCode, safeNext, TRIAL_DAYS } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2, "Tell us your name (at least 2 letters).").max(60),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
  ref: z.string().trim().max(32).optional().nullable(),
  next: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const blocked = await botGuard(req, "signup");
  if (blocked) return blocked;

  const { data, error } = await parseBody(req, schema);
  if (error) return error;

  if (await db.user.findUnique({ where: { email: data.email } })) {
    return apiError(409, "email_taken", "An account with this email already exists.", { fields: { email: "This email already has an account. Log in instead." } });
  }

  const referrer = data.ref ? await db.user.findUnique({ where: { referralCode: data.ref.toUpperCase() } }) : null;

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      plan: "trial",
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
      referralCode: await newReferralCode(data.name),
      referredById: referrer?.id ?? null,
      lastActiveAt: new Date(),
    },
  });
  await createSession(user.id);
  return json({ ok: true, redirect: safeNext(data.next, "/library?welcome=1") }, 201);
}
