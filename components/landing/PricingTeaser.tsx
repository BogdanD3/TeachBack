import { ButtonLink } from "@/components/ui/ButtonLink";
import { euro } from "@/lib/format";
import { PLANS } from "@/lib/plans";

export function PricingTeaser() {
  return (
    <section aria-labelledby="pricing-h" className="border-t border-line bg-paper-2">
      <div className="gutter mx-auto flex max-w-content flex-col gap-8 py-16 md:flex-row md:items-center md:justify-between md:py-20">
        <div className="max-w-reading">
          <h2 id="pricing-h" className="t-h2">Free to start. €9 when you&apos;re hooked.</h2>
          <p className="mt-2 text-ink-2">Every account gets 7 days of Pro. Students get 50% off.</p>
        </div>
        <ul className="flex flex-wrap gap-3" aria-label="Plans">
          {PLANS.map((p) => (
            <li key={p.id} className={`rounded-full border px-4 py-2 text-sm ${p.id === "pro" ? "border-coral bg-white font-semibold" : "border-line bg-white"}`}>
              {p.name} · {euro(p.priceCents)}
              {p.priceCents > 0 && <span className="text-ink-2">/mo</span>}
            </li>
          ))}
        </ul>
        <ButtonLink href="/pricing" variant="secondary">
          Compare plans
        </ButtonLink>
      </div>
    </section>
  );
}
