import type { Metadata } from "next";
import { PlanCard } from "@/components/pricing/PlanCard";
import { Highlight } from "@/components/ui/Highlight";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing", description: "Free, Pro at €9 a month, or Team for study groups. Start with a 7-day free trial." };

const faqs = [
  ["What happens after the free trial?", "You move to the Free plan automatically. Nothing is charged unless you choose Pro or Team."],
  ["Can I cancel any time?", "Yes. Pro and Team are monthly and you can cancel from your profile."],
  ["Do you have student discounts?", "Yes — use the code STUDENT50 at checkout for 50% off."],
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const href = (id: string) => (id === "free" ? (user ? "/library" : "/auth/signup") : user ? `/checkout?plan=${id}` : `/auth/signup?next=${encodeURIComponent(`/checkout?plan=${id}`)}`);

  return (
    <div className="gutter mx-auto max-w-content py-8 md:py-12">
      <div className="max-w-reading">
        <h1 className="t-h1">
          Pay for <Highlight>understanding</Highlight>, not for content
        </h1>
        <p className="mt-3 text-ink-2">Every account starts with a 7-day free trial of Pro. No card needed.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-stretch">
        {PLANS.map((p) => (
          <PlanCard key={p.id} plan={p} featured={p.id === "pro"} href={href(p.id)} current={user?.plan === p.id} />
        ))}
      </div>
      <section className="mt-16 max-w-reading" aria-labelledby="faq-h">
        <h2 id="faq-h" className="t-h2">Questions</h2>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {faqs.map(([q, a]) => (
            <div key={q} className="py-4">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-ink-2">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
