export const navLinks = [
  { href: "/library", label: "Library" },
  { href: "/live", label: "Live" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/community", label: "Community" },
  { href: "/pricing", label: "Pricing" },
] as const;

export type HeaderUser = { name: string; plan: string } | null;
