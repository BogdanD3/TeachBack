import { AlertCircle, CheckCircle2, CircleDashed, Circle } from "lucide-react";

export type ConceptStateName = "understood" | "shaky" | "gap";

// Text stays ink for AA contrast; the state colour lives in the icon, border and tint.
const config = {
  understood: { label: "Understood", Icon: CheckCircle2, cls: "bg-understood/12 border-understood/50", icon: "text-understood" },
  shaky: { label: "Shaky", Icon: CircleDashed, cls: "bg-shaky/15 border-shaky/60", icon: "text-shaky" },
  gap: { label: "Gap", Icon: AlertCircle, cls: "bg-gap/10 border-gap/50", icon: "text-gap" },
  neutral: { label: "Not yet", Icon: Circle, cls: "bg-paper-2 border-line", icon: "text-ink-2" },
} as const;

type Props = {
  state: ConceptStateName | "neutral";
  /** Text shown in the pill. Defaults to the state label. */
  children?: React.ReactNode;
  className?: string;
};

/** Concept pill. Colour always comes with an icon and a text label. */
export function Pill({ state, children, className }: Props) {
  const { label, Icon, cls, icon } = config[state];
  return (
    <span
      className={[
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-medium text-ink",
        cls,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className={`size-3.5 shrink-0 ${icon}`} aria-hidden />
      <span className="truncate">{children ?? label}</span>
      {children && <span className="sr-only">({label})</span>}
    </span>
  );
}
