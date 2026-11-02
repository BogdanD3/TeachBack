import Link from "next/link";

/** Speech-bubble mark + lowercase Fraunces wordmark. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <path
        d="M6 4h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H14l-6 5v-5H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"
        fill="var(--coral)"
      />
      <path d="M11 11.5h10M11 16.5h6" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex h-11 items-center gap-2 rounded-full pr-1" aria-label="Teachback home">
      <LogoMark />
      <span className="font-display text-[22px] font-semibold leading-none tracking-tight text-ink">teachback</span>
    </Link>
  );
}
