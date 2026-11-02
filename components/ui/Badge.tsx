type Tone = "highlight" | "ink" | "teal" | "coral" | "outline";

const tones: Record<Tone, string> = {
  highlight: "bg-highlight text-ink",
  ink: "bg-ink text-paper",
  teal: "bg-teal text-white",
  coral: "bg-coral-dark text-white",
  outline: "border border-line text-ink-2 bg-white",
};

export function Badge({
  tone = "highlight",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={["inline-flex items-center gap-1 rounded-full px-2.5 py-1 t-meta leading-none", tones[tone], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
