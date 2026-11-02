import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { requireUser } from "@/lib/auth";
import { findPlan } from "@/lib/plans";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: planId } = await searchParams;
  const user = await requireUser(`/checkout?plan=${planId ?? "pro"}`);
  const plan = findPlan(planId ?? "pro");
  if (!plan || plan.id === "free") redirect("/pricing");

  return (
    <div className="gutter mx-auto max-w-[880px] py-8 md:py-12">
      <h1 className="t-h1">Checkout</h1>
      <p className="mt-2 text-ink-2">Upgrade to {plan.name}. Cancel any time.</p>
      <div className="mt-8">
        <CheckoutForm plan={{ id: plan.id, name: plan.name, priceCents: plan.priceCents, period: plan.period }} userName={user.name} />
      </div>
    </div>
  );
}
