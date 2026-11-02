"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Input";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      (document.getElementById("referral-link") as HTMLInputElement | null)?.select();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="referral-link" className="sr-only">Your referral link</label>
      <input id="referral-link" name="referral-link" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className={inputClasses + " font-mono text-sm"} />
      <Button onClick={copy} variant="dark" data-action="copy_referral" className="shrink-0">
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
      </Button>
    </div>
  );
}
