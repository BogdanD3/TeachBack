// Email + password auth with an HTTP-only session cookie. Server-only.
import bcrypt from "bcryptjs";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { sessionSecret } from "./env";

export const SESSION_COOKIE = "tb_session";
const SESSION_DAYS = 30;
export const TRIAL_DAYS = 7;

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

/** Only a keyed hash of the token is stored, so a leaked DB can't be used to log in. */
const tokenHash = (token: string) => createHmac("sha256", sessionSecret()).update(token).digest("hex");

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({ data: { token: tokenHash(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { token: tokenHash(token) } });
  jar.delete(SESSION_COOKIE);
}

/** The logged-in user, or null. Cached per request. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { token: tokenHash(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Use in protected pages: redirects to login and comes back afterwards. */
export async function requireUser(nextPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Only allow same-site relative redirects. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export function trialDaysLeft(user: { plan: string; trialEndsAt: Date | null; bonusDays: number }): number {
  if (user.plan !== "trial" || !user.trialEndsAt) return 0;
  return Math.max(0, Math.ceil((user.trialEndsAt.getTime() - Date.now()) / 86_400_000));
}

export async function newReferralCode(name: string): Promise<string> {
  const base = name.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5) || "PIP";
  for (;;) {
    const code = base + randomBytes(2).toString("hex").toUpperCase();
    if (!(await db.user.findUnique({ where: { referralCode: code } }))) return code;
  }
}
