/** 30 small squares: filled = taken (ink), outlined = free. */
export function SeatBar({ total, booked }: { total: number; booked: number }) {
  const left = Math.max(0, total - booked);
  return (
    <div>
      <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 sm:max-w-[360px]" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`aspect-square rounded-[3px] transition-colors duration-200 ${i < booked ? "bg-ink" : "border-[1.5px] border-ink-2/50 bg-white"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-sm" aria-live="polite">
        <span className="font-mono font-medium">{left}</span> of {total} seats left
      </p>
    </div>
  );
}
