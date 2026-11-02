import type { Metadata } from "next";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { requireUser, trialDaysLeft } from "@/lib/auth";
import { db } from "@/lib/db";
import { euro, formatDate, plural } from "@/lib/format";
import { findPlan } from "@/lib/plans";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const [sessions, states, bookings, orders] = await Promise.all([
    db.teachSession.count({ where: { userId: user.id, status: "finished" } }),
    db.conceptState.groupBy({ by: ["state"], where: { userId: user.id }, _count: true }),
    db.booking.count({ where: { userId: user.id } }),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const count = (s: string) => states.find((x) => x.state === s)?._count ?? 0;
  const days = trialDaysLeft(user);
  const planName = user.plan === "trial" ? "Pro trial" : (findPlan(user.plan)?.name ?? user.plan);

  const stats = [
    ["Sessions finished", sessions],
    ["Concepts understood", count("understood")],
    ["Open gaps", count("gap") + count("shaky")],
    ["Points", user.points],
    ["Day streak", user.streak],
    ["Live seats booked", bookings],
  ] as const;

  return (
    <div className="gutter mx-auto max-w-[880px] py-8 md:py-12">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <h1 className="t-h2 truncate">{user.name}</h1>
          <p className="truncate text-sm text-ink-2">{user.email} · member since {formatDate(user.createdAt)}</p>
        </div>
      </div>

      <section className="mt-8 flex flex-col gap-4 rounded-card border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="plan-h">
        <div>
          <p className="t-meta text-ink-2">Plan</p>
          <h2 id="plan-h" className="t-h3 mt-1 flex items-center gap-2">
            {planName}
            {user.plan === "trial" && <Badge>{plural(days, "day")} left</Badge>}
          </h2>
          {user.bonusDays > 0 && <p className="mt-1 text-sm text-ink-2">Includes {user.bonusDays} bonus days from referrals.</p>}
        </div>
        {user.plan === "pro" || user.plan === "team" ? (
          <ButtonLink href="/pricing" variant="secondary">See plans</ButtonLink>
        ) : (
          <ButtonLink href="/checkout?plan=pro" data-action="upgrade">Upgrade to Pro</ButtonLink>
        )}
      </section>

      <section className="mt-8" aria-labelledby="stats-h">
        <h2 id="stats-h" className="t-h3">Your stats</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-card border border-line bg-white p-4">
              <dt className="text-sm text-ink-2">{label}</dt>
              <dd className="mt-1 font-display text-3xl">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {orders.length > 0 && (
        <section className="mt-8" aria-labelledby="orders-h">
          <h2 id="orders-h" className="t-h3">Orders</h2>
          <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-white text-sm">
            {orders.map((o) => (
              <li key={o.id} className="flex justify-between gap-4 p-4">
                <span>{findPlan(o.plan)?.name} · {formatDate(o.createdAt)}</span>
                <span className="font-mono">{euro(o.amountCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action="/api/auth/logout" method="post" id="logout-form-profile" name="logout-form-profile" className="mt-12">
        <button type="submit" data-action="logout" className="inline-flex min-h-11 items-center text-sm font-semibold text-coral-dark underline-offset-4 hover:underline">Log out</button>
      </form>
    </div>
  );
}
