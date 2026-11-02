"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { Input } from "@/components/ui/Input";
import { postJson } from "@/lib/client/post-json";
import { euro } from "@/lib/format";
import { PromoField, type AppliedPromo } from "./PromoField";

type Props = { plan: { id: string; name: string; priceCents: number; period: string }; userName: string };

const fmtCard = (v: string) => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
const fmtExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function CheckoutForm({ plan, userName }: Props) {
  const router = useRouter();
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [card, setCard] = useState({ cardName: userName, cardNumber: "", cardExpiry: "", cardCvc: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const total = promo ? promo.totalCents : plan.priceCents;

  async function pay() {
    setPending(true);
    setError("");
    setFields({});
    const res = await postJson<{ redirect: string }>("/api/checkout", { plan: plan.id, promo: promo?.code ?? null, ...card }, { onRetry: pay });
    if (res.ok) return router.push(res.data.redirect);
    setPending(false);
    setFields(res.fields ?? {});
    if (res.fields?.code) setPromo(null);
    if (!res.fields && res.error !== "challenge" && res.error !== "blocked") setError(res.message);
  }

  const set = (k: keyof typeof card) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((c) => ({ ...c, [k]: k === "cardNumber" ? fmtCard(e.target.value) : k === "cardExpiry" ? fmtExpiry(e.target.value) : k === "cardCvc" ? e.target.value.replace(/\D/g, "").slice(0, 4) : e.target.value }));

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_340px]">
      <form
        id="checkout-form"
        name="checkout-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          pay();
        }}
        className="order-2 space-y-5 md:order-1"
      >
        <p className="rounded-card border border-dashed border-ink-2/50 bg-paper-2 p-3 text-sm">
          <strong>Demo — no real payment.</strong> Use test card <span className="font-mono">4242 4242 4242 4242</span>, any future date and any CVC.
        </p>
        <Input id="checkout-card-name" name="cardName" label="Name on card" autoComplete="cc-name" value={card.cardName} onChange={set("cardName")} error={fields.cardName} />
        <Input id="checkout-card-number" name="cardNumber" label="Card number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" value={card.cardNumber} onChange={set("cardNumber")} error={fields.cardNumber} />
        <div className="grid grid-cols-2 gap-4">
          <Input id="checkout-card-expiry" name="cardExpiry" label="Expiry (MM/YY)" inputMode="numeric" autoComplete="cc-exp" placeholder="08/29" value={card.cardExpiry} onChange={set("cardExpiry")} error={fields.cardExpiry} />
          <Input id="checkout-card-cvc" name="cardCvc" label="CVC" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={card.cardCvc} onChange={set("cardCvc")} error={fields.cardCvc} />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" fullWidth size="lg" loading={pending} data-action="checkout">
          <Lock className="size-4" aria-hidden /> Pay {euro(total)}
        </Button>
      </form>

      <aside className="order-1 rounded-card border border-line bg-white p-6 md:order-2" aria-label="Order summary">
        <h2 className="t-h3">Teachback {plan.name}</h2>
        <p className="text-sm text-ink-2">{plan.period}</p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Price</dt><dd>{euro(plan.priceCents)}</dd></div>
          {promo && (
            <div className="flex justify-between"><dt>Discount ({promo.percentOff}%)</dt><dd>−{euro(plan.priceCents - promo.totalCents)}</dd></div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total today</dt><dd>{euro(total)}</dd></div>
        </dl>
        <div className="mt-6">
          <PromoField plan={plan.id} applied={promo} onApplied={setPromo} />
        </div>
      </aside>
    </div>
  );
}
