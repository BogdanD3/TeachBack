import { CalendarClock, Flame, Sparkles, Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pip } from "@/components/teach/Pip";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Pill, type ConceptStateName } from "@/components/ui/Pill";
import { requireUser, trialDaysLeft } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, plural, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const now = new Date();
  const [active, lastDone, weak, events] = await Promise.all([
    db.teachSession.findFirst({ where: { userId: user.id, status: "active" }, include: { topic: true, _count: { select: { messages: true } } }, orderBy: { startedAt: "desc" } }),
    db.teachSession.findFirst({ where: { userId: user.id, status: "finished" }, include: { topic: { include: { _count: { select: { concepts: true } } } } }, orderBy: { finishedAt: "desc" } }),
    db.conceptState.findMany({ where: { userId: user.id, state: { in: ["gap", "shaky"] } }, include: { concept: { include: { topic: true } } }, orderBy: { updatedAt: "desc" }, take: 12 }),
    db.liveEvent.findMany({ where: { startsAt: { gt: now } }, orderBy: { startsAt: "asc" }, take: 3, include: { _count: { select: { bookings: true } } } }),
  ]);
  const weakest = [...weak].sort((a, b) => (a.state === b.state ? 0 : a.state === "gap" ? -1 : 1)).slice(0, 5);
  const days = trialDaysLeft(user);

  return (
    <div className="gutter mx-auto max-w-content py-8 md:py-12">
      <h1 className="t-h1">Hi, {user.name.split(" ")[0]}</h1>
      <ul className="mt-4 flex flex-wrap gap-3 text-sm" aria-label="Your stats">
        <li className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5"><Flame className="size-4 text-coral-dark" aria-hidden />{plural(user.streak, "day")} streak</li>
        <li className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5"><Sparkles className="size-4 text-shaky" aria-hidden />{user.points} points</li>
        {user.plan === "trial" && (
          <li className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5"><Timer className="size-4 text-teal" aria-hidden />{plural(days, "day")} of trial left</li>
        )}
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <Card tone="paper" className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Pip state={active ? "confused" : "idle"} size={96} />
          <div className="flex-1">
            {active ? (
              <>
                <p className="t-meta text-ink-2">Pip is still waiting</p>
                <h2 className="t-h2 mt-1">{active.topic.title}</h2>
                <p className="mt-1 text-sm text-ink-2">Started {timeAgo(active.startedAt)} · {plural(active._count.messages, "message")}</p>
                <ButtonLink href={`/teach/${active.topic.slug}`} className="mt-4" data-action="continue_session">Continue session</ButtonLink>
              </>
            ) : lastDone ? (
              <>
                <p className="t-meta text-ink-2">Last session</p>
                <h2 className="t-h2 mt-1">{lastDone.topic.title}</h2>
                <p className="mt-1 text-sm text-ink-2">{lastDone.score} of {lastDone.topic._count.concepts} concepts solid · {timeAgo(lastDone.finishedAt ?? lastDone.startedAt)}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <ButtonLink href="/library" data-action="start_teach">Teach something new</ButtonLink>
                  <ButtonLink href={`/report/${lastDone.id}`} variant="secondary">See report</ButtonLink>
                </div>
              </>
            ) : (
              <>
                <h2 className="t-h2">Teach Pip your first topic</h2>
                <p className="mt-1 text-ink-2">Ten minutes. You&apos;ll see exactly what you understand.</p>
                <ButtonLink href="/teach/photosynthesis" className="mt-4" data-action="start_teach">Start with Photosynthesis</ButtonLink>
              </>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="t-h3">Weakest concepts</h2>
          {weakest.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">No gaps yet. Finish a session and the shaky parts show up here.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {weakest.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3">
                  <Link href={`/lesson/${w.id}`} className="group block min-h-11 min-w-0 py-1">
                    <span className="block truncate font-medium underline-offset-4 group-hover:underline">{w.concept.name}</span>
                    <span className="block truncate text-xs text-ink-2">{w.concept.topic.title}</span>
                  </Link>
                  <Pill state={w.state as ConceptStateName} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
          <ButtonLink href="/map" variant="ghost" className="mt-4">Open your map</ButtonLink>
        </Card>
      </div>

      <section className="mt-12" aria-labelledby="upcoming-h">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="upcoming-h" className="t-h2">Upcoming live</h2>
          <ButtonLink href="/live" variant="ghost">All events</ButtonLink>
        </div>
        {events.length === 0 ? (
          <p className="mt-4 text-ink-2">No live events scheduled right now.</p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/live#${e.slug}`} className="lift block h-full rounded-card border border-line bg-white p-6">
                  <p className="t-meta text-teal">{e.type === "challenge" ? "Weekly challenge" : "Live session"}</p>
                  <h3 className="t-h3 mt-2">{e.title}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-ink-2"><CalendarClock className="size-4" aria-hidden />{formatDateTime(e.startsAt)}</p>
                  <p className="mt-1 text-sm text-ink-2">{Math.max(0, e.seatsTotal - e._count.bookings)} of {e.seatsTotal} seats left</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
