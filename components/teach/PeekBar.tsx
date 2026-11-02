"use client";

import { Eye, X } from "lucide-react";
import { useState } from "react";
import { postJson } from "@/lib/client/post-json";

type PeekResult = { concept: string; hint: string; cost: number; points: number; peeks: string[] };

/** "Peek" button + hint card above the chat input. 5 points per concept, re-peeking the same concept is free. */
export function PeekBar({ sessionId, disabled, initialPeeks }: { sessionId: string; disabled: boolean; initialPeeks: string[] }) {
  const [peek, setPeek] = useState<PeekResult | null>(null);
  const [count, setCount] = useState(initialPeeks.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onPeek() {
    setLoading(true);
    setError("");
    const res = await postJson<PeekResult>(`/api/teach/${sessionId}/peek`, {});
    setLoading(false);
    if (!res.ok) return setError(res.message);
    setPeek(res.data);
    setCount(res.data.peeks.length);
  }

  return (
    <div className="mx-auto mb-2 w-full max-w-3xl">
      {peek && (
        <div className="mb-2 flex items-start gap-3 rounded-card border-[1.5px] border-highlight bg-highlight/40 p-3 md:p-4" role="status" id="peek-hint">
          <Eye className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="t-meta">Peek · {peek.concept}</p>
            <p className="mt-1 text-sm">{peek.hint}</p>
            <p className="mt-1 text-xs text-ink-2">{peek.cost > 0 ? `−${peek.cost} points · ${peek.points} left` : "Already peeked — free"}</p>
          </div>
          <button type="button" onClick={() => setPeek(null)} aria-label="Close hint" className="-m-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-highlight/60">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPeek}
          disabled={disabled || loading}
          data-action="peek"
          aria-controls="peek-hint"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-line bg-white px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:border-ink disabled:opacity-50"
        >
          <Eye className="size-4" aria-hidden />
          Peek · 5 pts
        </button>
        {count > 0 && <span className="t-meta text-ink-2">{count} peek{count > 1 ? "s" : ""} used</span>}
        {error && (
          <span role="alert" className="text-sm">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
