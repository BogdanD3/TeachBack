import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pip } from "@/components/teach/Pip";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { euro, formatDate } from "@/lib/format";
import { findPlan } from "@/lib/plans";

export const metadata: Metadata = { title: "You're upgraded", robots: { index: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  const user = await requireUser("/profile");
  const order = orderId ? await db.order.findUnique({ where: { id: orderId }, include: { promoCode: true } }) : null;
  if (!order || order.userId !== user.id) notFound();
  const plan = findPlan(order.plan);

  return (
    <div className="gutter mx-auto max-w-reading py-12 text-center md:py-24">
      <Pip state="got-it" size={120} className="mx-auto" />
      <h1 className="t-h1 mt-6">Welcome to {plan?.name ?? order.plan}</h1>
      <p className="mt-3 text-ink-2">Unlimited sessions, mini-lessons and live events are unlocked.</p>
      <dl className="mx-auto mt-8 max-w-sm space-y-2 rounded-card border border-line bg-white p-6 text-left text-sm">
        <div className="flex justify-between"><dt className="text-ink-2">Order</dt><dd className="font-mono">{order.id.slice(-8).toUpperCase()}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-2">Date</dt><dd>{formatDate(order.createdAt)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-2">Card</dt><dd className="font-mono">•••• {order.cardLast4}</dd></div>
        {order.promoCode && <div className="flex justify-between"><dt className="text-ink-2">Promo</dt><dd className="font-mono">{order.promoCode.code}</dd></div>}
        <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Paid (simulated)</dt><dd>{euro(order.amountCents)}</dd></div>
      </dl>
      <ButtonLink href="/library" className="mt-8">Teach something</ButtonLink>
    </div>
  );
}
