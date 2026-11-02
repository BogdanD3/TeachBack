import { ButtonLink } from "@/components/ui/ButtonLink";
import { Pill, type ConceptStateName } from "@/components/ui/Pill";

type Props = {
  name: string;
  state: ConceptStateName;
  evidence: string;
  feedback: string;
  conceptStateId?: string;
};

export function ConceptResult({ name, state, evidence, feedback, conceptStateId }: Props) {
  return (
    <li className="rounded-card border border-line bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="t-h3">{name}</h3>
        <Pill state={state} />
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
