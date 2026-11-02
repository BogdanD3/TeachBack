export type PlanId = "free" | "pro" | "team";

export type Plan = { id: PlanId; name: string; priceCents: number; period: string; blurb: string; features: string[]; cta: string };

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceCents: 0,
    period: "forever",
    blurb: "Try teaching Pip, no card needed.",
    features: ["3 teach sessions a month", "Gap report after every session", "Understanding Map", "Community forum"],
    cta: "Start free",
  },
  {
    id: "pro",
    name: "Pro",
    priceCents: 900,
    period: "per month",
    blurb: "For students who want to really know it.",
    features: ["Unlimited teach sessions", "Mini-lessons for every gap", "Voice mode: talk to Pip", "Book live sessions and challenges", "Monthly leaderboard prizes"],
    cta: "Get Pro",
  },
  {
    id: "team",
    name: "Team",
    priceCents: 2900,
    period: "per month, up to 5 people",
    blurb: "For study groups and tutors.",
    features: ["Everything in Pro for 5 people", "Shared group Understanding Map", "Private live sessions", "Priority support"],
    cta: "Get Team",
  },
];

export const findPlan = (id: string | undefined | null) => PLANS.find((p) => p.id === id);

export function discounted(priceCents: number, percentOff: number): number {
  return Math.max(0, Math.round(priceCents * (1 - percentOff / 100)));
}
