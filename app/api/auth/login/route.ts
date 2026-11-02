import { z } from "zod";
import { apiError, botGuard, json, parseBody } from "@/lib/api";
import { createSession, safeNext, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const blocked = await botGuard(req, "login");
  if (blocked) return blocked;

  // Basic brute-force brake, independent of BotLens.
  const rl = rateLimit(`login:${clientIp(req.headers)}`, 20, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", `Too many attempts. Try again in ${rl.retryAfterSec}s.`);

  const { data, error } = await parseBody(req, schema);
  if (error) return error;

  const user = await db.user.findUnique({ where: { email: data.email } });
  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    return apiError(401, "invalid_credentials", "That email and password don't match.");
  }
  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  return json({ ok: true, redirect: safeNext(data.next) });
}
