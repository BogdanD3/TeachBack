"use client";

import { Tag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { postJson } from "@/lib/client/post-json";

export type AppliedPromo = { code: string; description: string; percentOff: number; totalCents: number };

export function PromoField({ plan, applied, onApplied }: { plan: string; applied: AppliedPromo | null; onApplied: (p: AppliedPromo | null) => void }) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    setPending(true);
    setError("");
    const res = await postJson<AppliedPromo>("/api/checkout/promo", { code, plan }, { onRetry: apply });
    setPending(false);
    if (res.ok) {
      onApplied(res.data);
      setCode("");
      return;
    }
    if (res.error !== "challenge" && res.error !== "blocked") setError(res.fields?.code ?? res.message);
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-card border border-understood/50 bg-understood/10 p-3 text-sm">
        <span className="flex items-center gap-2">
          <Tag className="size-4 text-understood" aria-hidden />
          <span>
            <strong className="font-mono">{applied.code}</strong> — {applied.description}
          </span>
        </span>
        <button type="button" onClick={() => onApplied(null)} className="grid size-11 place-items-center rounded-full hover:bg-white" aria-label="Remove promo code">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <form
      id="promo-form"
      name="promo-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="flex items-start gap-2"
    >
      <Input
        id="promo-code"
        name="code"
        label="Promo code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        autoComplete="off"
        error={error}
        className="flex-1"
      />
      <Button type="submit" variant="secondary" className="mt-7" loading={pending} disabled={!code.trim()} data-action="apply_promo">
        Apply
      </Button>
    </form>
  );
}
