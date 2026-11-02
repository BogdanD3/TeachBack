import { Gift } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Highlight } from "@/components/ui/Highlight";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Start your free trial", description: "Sign up for Teachback and get 7 days free." };

const perks = ["Teach Pip any of 12 topics", "Gap reports after every session", "Mini-lessons for every gap", "Book live sessions and challenges"];

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string; next?: string }> }) {
  const { ref, next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));
  const referrer = ref ? await db.user.findUnique({ where: { referralCode: ref.toUpperCase() }, select: { name: true, referralCode: true } }) : null;

  return (
    <AuthShell
      title={
        <>
          Learn it by <Highlight>teaching</Highlight> it
        </>
      }
      subtitle="Create your account. Your 7-day free trial starts now."
      aside={
        <ul className="mt-6 space-y-2 text-ink-2">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span aria-hidden className="size-1.5 rounded-full bg-coral" />
              {p}
            </li>
          ))}
        </ul>
      }
    >
      {referrer && (
        <p className="mb-6 flex items-center gap-2 rounded-card bg-highlight/40 p-3 text-sm">
          <Gift className="size-4 shrink-0" aria-hidden />
          {referrer.name.split(" ")[0]} invited you. You both get a free week.
        </p>
      )}
      <SignupForm referralCode={referrer?.referralCode} next={next ? safeNext(next) : undefined} />
    </AuthShell>
  );
}
