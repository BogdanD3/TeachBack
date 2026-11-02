import { Eye } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Pill, type ConceptStateName } from "@/components/ui/Pill";

type Props = {
  name: string;
  state: ConceptStateName;
  evidence: string;
  feedback: string;
  conceptStateId?: string;
  peeked?: boolean;
};

export function ConceptResult({ name, state, evidence, feedback, conceptStateId, peeked }: Props) {
  return (
    <li className="rounded-card border border-line bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="t-h3">{name}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {peeked && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em]" title="You used Peek on this concept">
              <Eye className="size-3.5" aria-hidden />
              Peeked
            </span>
          )}
          <Pill state={state} />
        </div>
      </div>
      {evidence ? (
        <blockquote className="mt-3 border-l-[3px] border-coral pl-4 italic text-ink">
          <span className="sr-only">You said: </span>“{evidence}”
        </blockquote>
      ) : (
        <p className="mt-3 border-l-[3px] border-line pl-4 text-sm text-ink-2">You didn&apos;t explain this one.</p>
      )}
      <p className="mt-3 text-sm text-ink-2">{feedback}</p>
      {conceptStateId && state !== "understood" && (
        <ButtonLink
          href={`/lesson/${conceptStateId}`}
          variant={state === "gap" ? "primary" : "secondary"}
          size="sm"
          className="mt-4"
          data-action="fix_gap"
        >
          {state === "gap" ? "Fix this gap" : "Firm this up"}
        </ButtonLink>
      )}
    </li>
  );
}
