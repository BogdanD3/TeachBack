import { Flame, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { POINTS, startOfMonth } from "@/lib/points";

export const metadata: Metadata = { title: "Leaderboard", description: "This month's top teachers on Teachback." };

const ribbons = ["bg-coral-dark text-white", "bg-ink text-paper", "bg-teal text-white"];

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  const from = startOfMonth();
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(from);
  const sums = await db.pointEvent.groupBy({ by: ["userId"], where: { createdAt: { gte: from } }, _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } } });
  const people = await db.user.findMany({ where: { id: { in: sums.map((s) => s.userId) } }, select: { id: true, name: true, streak: true } });
  const byId = new Map(people.map((p) => [p.id, p]));
  const rows = sums.map((s, i) => ({ rank: i + 1, points: s._sum.amount ?? 0, ...byId.get(s.userId)! })).filter((r) => r.name);
  const top = rows.slice(0, 20);
  const me = user ? rows.find((r) => r.id === user.id) : undefined;
  const meOutside = me && me.rank > top.length;

  return (
    <div className="gutter mx-auto max-w-[880px] py-8 md:py-12">
      <h1 className="t-h1">Leaderboard</h1>
      <p className="mt-2 text-ink-2">
        {month}. {POINTS.sessionFinished} points per finished session, {POINTS.gapClosed} for every gap you close.
      </p>

      <div className="mt-8 flex flex-col gap-4 rounded-card bg-ink p-6 text-paper sm:flex-row sm:items-center">
        <Trophy className="size-10 shrink-0 text-highlight" aria-hidden />
        <div className="flex-1">
          <p className="t-meta text-highlight">Monthly prize</p>
          <p className="mt-1 font-display text-xl">The top 3 at the end of {new Intl.DateTimeFormat("en-GB", { month: "long" }).format(from)} win a year of Pro.</p>
          <p className="mt-1 text-sm text-paper/80">Number one also gets a seat on the host panel of next month&apos;s explain-off.</p>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No points yet this month" body="Finish a session to be the first on the board." action={<ButtonLink href="/library">Teach something</ButtonLink>} />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left">
            <caption className="sr-only">Ranking for {month}</caption>
            <thead className="border-b border-line bg-paper-2">
              <tr className="t-meta text-ink-2">
                <th scope="col" className="w-16 px-4 py-3">Rank</th>
                <th scope="col" className="px-2 py-3">Teacher</th>
                <th scope="col" className="hidden px-4 py-3 text-right sm:table-cell">Streak</th>
                <th scope="col" className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {[...top, ...(meOutside && me ? [me] : [])].map((r) => {
                const mine = r.id === user?.id;
                return (
                  <tr key={r.id} className={`border-b border-line last:border-0 ${mine ? "bg-highlight/35" : ""}`} aria-current={mine ? "true" : undefined}>
                    <td className="px-4 py-3">
                      {r.rank <= 3 ? (
                        <span className={`inline-grid h-7 min-w-9 place-items-center rounded-full px-2 font-mono text-sm font-medium ${ribbons[r.rank - 1]}`}>{r.rank}</span>
                      ) : (
                        <span className="font-mono text-sm text-ink-2">{r.rank}</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={r.name} size="sm" />
                        <span className="truncate font-medium">
                          {r.name}
                          {mine && <span className="ml-2 text-sm text-ink-2">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-right sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-sm"><Flame className="size-4 text-coral-dark" aria-hidden />{r.streak}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {user && !me && <p className="mt-4 text-sm text-ink-2">You&apos;re not on the board yet this month. Finish a session to join.</p>}
    </div>
  );
}
