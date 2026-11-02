import { Star } from "lucide-react";

/** Read-only star rating with an accessible label. */
export function Stars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const px = size === "sm" ? "size-3.5" : "size-5";
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${value.toFixed(1)} out of 5${count !== undefined ? `, ${count} reviews` : ""}`}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`${px} ${i <= Math.round(value) ? "fill-shaky text-shaky" : "text-line"}`} />
        ))}
      </span>
      <span aria-hidden className="text-sm font-semibold">
        {value.toFixed(1)}
      </span>
      {count !== undefined && (
        <span aria-hidden className="text-sm text-ink-2">
          ({count})
        </span>
      )}
    </span>
  );
}
