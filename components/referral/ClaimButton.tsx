"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { postJson } from "@/lib/client/post-json";

export function ClaimButton({ count }: { count: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState("");

  async function claim() {
    setPending(true);
    setMsg("");
    const res = await postJson<{ weeks: number }>("/api/referral/claim", {}, { onRetry: claim });
    setPending(false);
    if (res.ok) {
      setMsg(`Done — ${res.data.weeks} free ${res.data.weeks === 1 ? "week" : "weeks"} added.`);
      router.refresh();
    } else if (res.error !== "challenge" && res.error !== "blocked") setMsg(res.message);
  }

  return (
    <div>
      <Button onClick={claim} loading={pending} disabled={count === 0} data-action="referral_claim">
        {count > 0 ? `Claim ${count} free ${count === 1 ? "week" : "weeks"}` : "Nothing to claim yet"}
      </Button>
      {msg && <p role="status" className="mt-2 text-sm font-medium">{msg}</p>}
    </div>
  );
}
