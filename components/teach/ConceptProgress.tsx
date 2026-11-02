export function ConceptProgress({ concepts, covered }: { concepts: string[]; covered: string[] }) {
  const set = new Set(covered);
  const n = concepts.filter((c) => set.has(c)).length;
  return (
    <div className="flex items-center gap-3">
      <ol className="flex gap-1" aria-hidden>
        {concepts.map((c) => (
          <li key={c} title={c} className={`size-2.5 rounded-full transition-colors duration-200 ${set.has(c) ? "bg-understood" : "border-[1.5px] border-ink-2/40"}`} />
        ))}
      </ol>
      <p className="text-sm text-ink-2" aria-live="polite">
        <span className="font-semibold text-ink">{n}</span> of {concepts.length}
        <span className="hidden sm:inline"> concepts covered</span>
        <span className="sr-only sm:hidden"> concepts covered</span>
      </p>
    </div>
  );
}
