"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BOTLENS_EVENT, type BotLensVerdictDetail } from "@/lib/client/post-json";

/** Shows the BotLens verdict UI: 429 challenge → "verify you're human", 403 → blocked. */
export function BotLensGate() {
  const [verdict, setVerdict] = useState<BotLensVerdictDetail | null>(null);

  useEffect(() => {
    const on = (e: Event) => setVerdict((e as CustomEvent<BotLensVerdictDetail>).detail);
    window.addEventListener(BOTLENS_EVENT, on);
    return () => window.removeEventListener(BOTLENS_EVENT, on);
  }, []);

  const close = () => setVerdict(null);

  if (verdict?.kind === "blocked") {
    return (
      <Modal id="botlens-blocked" open onClose={close} title="This action was blocked">
        <div className="flex gap-3">
          <ShieldAlert className="mt-1 size-5 shrink-0 text-gap" aria-hidden />
          <p className="text-ink-2">
            Our protection flagged this request as automated. If you&apos;re a person, wait a minute and try again, or contact us.
          </p>
        </div>
        <Button className="mt-6" fullWidth variant="secondary" onClick={close}>
          Close
        </Button>
      </Modal>
    );
  }

  return (
    <Modal id="botlens-challenge" open={verdict?.kind === "challenge"} onClose={close} title="Please verify you're human">
      <div className="flex gap-3">
        <ShieldCheck className="mt-1 size-5 shrink-0 text-teal" aria-hidden />
        <p className="text-ink-2">We saw unusual activity from this browser. Confirm you&apos;re a person to continue.</p>
      </div>
      {/* BotLens: render your challenge widget here (id="botlens-challenge-slot"). */}
      <div id="botlens-challenge-slot" className="mt-4" />
      <Button
        className="mt-6"
        fullWidth
        data-action="botlens_verify"
        onClick={() => {
          const retry = verdict?.retry;
          close();
          retry?.();
        }}
      >
        I&apos;m human, try again
      </Button>
    </Modal>
  );
}
