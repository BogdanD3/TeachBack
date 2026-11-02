import Link from "next/link";
import { LogoMark } from "@/components/Logo";

const cols = [
  {
    title: "Learn",
    links: [
      { href: "/library", label: "Topic library" },
      { href: "/live", label: "Live sessions" },
      { href: "/map", label: "Understanding Map" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/community", label: "Forum" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/referral", label: "Invite a friend" },
    ],
  },
  {
    title: "Teachback",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/auth/signup", label: "Start free trial" },
      { href: "/auth/login", label: "Log in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      <div className="gutter mx-auto grid max-w-content gap-8 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-xl font-semibold">teachback</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-2">Learn it by teaching it. Explain it to Pip. Find out what you really understand.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h2 className="t-meta text-ink-2">{c.title}</h2>
            <ul className="mt-3 space-y-1">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-11 items-center text-sm hover:text-coral-dark hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="gutter mx-auto max-w-content border-t border-line py-6 text-sm text-ink-2">
        © {new Date().getFullYear()} Teachback · Hackathon demo. Payments are simulated.
      </div>
    </footer>
  );
}
