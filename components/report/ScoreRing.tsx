/** Ring showing how many concepts are solid. Segment colour is decorative; the text carries the meaning. */
export function ScoreRing({ score, total, size = 132 }: { score: number; total: number; size?: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = total ? score / total : 0;
  return (
    <figure className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden className="shrink-0">
        <g transform="rotate(-90 60 60)">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--understood)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
          />
        </g>
        <text x="60" y="70" textAnchor="middle" fontSize="28" fontWeight="600" fill="var(--ink)" fontFamily="var(--font-display), serif">
          {score}/{total}
        </text>
      </svg>
      <figcaption>
        <p className="t-h3">
          {score} of {total} concepts solid
        </p>
        <p className="text-sm text-ink-2">{pct >= 0.8 ? "Strong explanation." : pct >= 0.5 ? "Good start. A few gaps to close." : "Pip got lost a lot. Let's fix that."}</p>
      </figcaption>
    </figure>
  );
}
