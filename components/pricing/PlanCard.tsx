import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { euro } from "@/lib/format";
import type { Plan } from "@/lib/plans";

export function PlanCard({ plan, featured, href, current }: { plan: Plan; featured?: boolean; href: string; current?: boolean }) {
  return (
    <article
      className={`relative flex flex-col rounded-card bg-white p-6 md:p-8 ${featured ? "border-2 border-coral" : "border border-line"}`}
      aria-label={`${plan.name} plan`}
    >
      {featured && (
        <span className="marker absolute -top-3 left-6 rounded-sm px-2 font-mono text-xs font-medium uppercase tracking-wider">Most popular</span>
      )}
      <h3 className="t-h3">{plan.name}</h3>
      <p className="mt-1 text-sm text-ink-2">{plan.blurb}</p>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="font-display text-[44px] font-semibold leading-none">{euro(plan.priceCents)}</span>
        <span className="text-sm text-ink-2">{plan.period}</span>
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-understood" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">
        {current ? (
          <p className="flex h-12 items-center justify-center rounded-full border border-line font-semibold text-ink-2">Your current plan</p>
        ) : (
          <ButtonLink href={href} variant={featured ? "primary" : "secondary"} fullWidth data-action={`choose_${plan.id}`}>
            {plan.cta}
          </ButtonLink>
        )}
      </div>
    </article>
  );
}
