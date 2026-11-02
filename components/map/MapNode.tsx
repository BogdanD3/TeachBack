"use client";

import { AlertCircle, CheckCircle2, Circle, CircleDashed } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Modal } from "@/components/ui/Modal";
import { Pill, type ConceptStateName } from "@/components/ui/Pill";

export type MapConcept = {
  name: string;
  state: ConceptStateName | "neutral";
  stateId?: string;
  evidence?: string;
  feedback?: string;
  updated?: string;
  topicSlug: string;
};

const styles = {
  // Ink text on strong tints keeps AA contrast; the state colour is in border, tint and icon.
  understood: { cls: "bg-understood/25 text-ink border-understood [&>svg]:text-understood", Icon: CheckCircle2 },
  shaky: { cls: "bg-shaky/30 text-ink border-shaky [&>svg]:text-ink", Icon: CircleDashed },
  gap: { cls: "bg-gap/20 text-ink border-gap [&>svg]:text-gap", Icon: AlertCircle },
  neutral: { cls: "bg-white text-ink-2 border-line border-dashed", Icon: Circle },
} as const;

const labels = { understood: "understood", shaky: "shaky", gap: "gap", neutral: "not taught yet" };

export function MapNode({ c }: { c: MapConcept }) {
  const [open, setOpen] = useState(false);
  const { cls, Icon } = styles[c.state];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={c.evidence ? `“${c.evidence}”` : c.name}
        aria-label={`${c.name}: ${labels[c.state]}. Show details`}
        className={`flex min-h-11 max-w-full items-center gap-2 rounded-full border-[1.5px] px-3 py-2 text-left text-sm font-medium transition-transform duration-150 hover:-translate-y-0.5 ${cls}`}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{c.name}</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={c.name}>
        <Pill state={c.state} />
        {c.state === "neutral" ? (
          <p className="mt-4 text-ink-2">You haven&apos;t explained this to Pip yet.</p>
        ) : (
          <>
            {c.evidence ? (
              <blockquote className="mt-4 border-l-[3px] border-coral pl-4 italic">“{c.evidence}”</blockquote>
            ) : (
              <p className="mt-4 text-ink-2">No quote — this didn&apos;t come up in your explanation.</p>
            )}
            {c.feedback && <p className="mt-3 text-sm text-ink-2">{c.feedback}</p>}
            {c.updated && <p className="t-meta mt-4 text-ink-2">Last checked {c.updated}</p>}
          </>
        )}
        <div className="mt-6 flex flex-col gap-2">
          {c.stateId && c.state !== "understood" && c.state !== "neutral" && (
            <ButtonLink href={`/lesson/${c.stateId}`} fullWidth data-action="fix_gap">
              {c.state === "gap" ? "Fix this gap" : "Firm this up"}
            </ButtonLink>
          )}
          <ButtonLink href={`/teach/${c.topicSlug}?new=1`} variant="secondary" fullWidth>
            Teach Pip again
          </ButtonLink>
        </div>
      </Modal>
    </>
  );
}
