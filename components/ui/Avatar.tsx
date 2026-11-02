const palettes = [
  "bg-coral-dark text-white",
  "bg-teal text-white",
  "bg-understood text-ink",
  "bg-shaky text-ink",
  "bg-ink text-paper",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" };

export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      role="img"
      aria-label={name}
      className={[
        "inline-grid shrink-0 place-items-center rounded-full font-semibold",
        palettes[hash(name) % palettes.length],
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden>{initials(name)}</span>
    </span>
  );
}
