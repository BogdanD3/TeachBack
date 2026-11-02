const names = ["", "Beginner", "Intermediate", "Advanced"];

export function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Difficulty: ${names[level] ?? level}`}>
      <span className="inline-flex gap-1" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`size-2 rounded-full ${i <= level ? "bg-ink" : "border border-ink-2/50"}`} />
        ))}
      </span>
      <span aria-hidden className="text-sm text-ink-2">
        {names[level]}
      </span>
    </span>
  );
}
