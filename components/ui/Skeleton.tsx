export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={["animate-pulse rounded-card bg-paper-2", className].filter(Boolean).join(" ")} />;
}
