const pad = (n: number) => String(n).padStart(2, "0");

export function splitDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function shortDuration(ms: number): string {
  const { d, h, m, s } = splitDuration(ms);
  if (d > 0) return `${d}d ${pad(h)}h`;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/** Big mono HH:MM:SS (with days when needed). */
export function Countdown({ ms, label }: { ms: number; label: string }) {
  const { d, h, m, s } = splitDuration(ms);
  const parts = [...(d > 0 ? [[d, "days"] as const] : []), [h, "hrs"] as const, [m, "min"] as const, [s, "sec"] as const];
  return (
    <div>
      <p className="t-meta text-ink-2">{label}</p>
      <div className="mt-1 flex items-end gap-2" role="timer" aria-label={`${label} ${d ? `${d} days ` : ""}${h} hours ${m} minutes ${s} seconds`}>
        {parts.map(([v, unit], i) => (
          <div key={unit} className="flex items-end gap-2" aria-hidden>
            {i > 0 && <span className="pb-4 font-mono text-2xl text-ink-2">:</span>}
            <div className="text-center">
              <span className="block font-mono text-[32px] font-medium leading-none tabular-nums md:text-[40px]">{pad(v)}</span>
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-ink-2">{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
