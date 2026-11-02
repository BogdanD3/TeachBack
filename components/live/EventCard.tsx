import { CalendarClock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Countdown, shortDuration } from "./Countdown";
import { SeatBar } from "./SeatBar";

export type LiveEventView = {
  id: string;
  slug: string;
  title: string;
  type: string;
  host: string;
  hostRole: string;
  description: string;
  startsLabel: string;
  durationMin: number;
  seatsTotal: number;
  prize: string | null;
};

type Props = {
  e: LiveEventView;
  booked: number;
  mine: boolean;
  opensInMs: number;
  loggedIn: boolean;
  pending: boolean;
  message?: string;
  onBook: () => void;
};

export function EventCard({ e, booked, mine, opensInMs, loggedIn, pending, message, onBook }: Props) {
  const open = opensInMs <= 0;
  const soldOut = booked >= e.seatsTotal;

  let action: React.ReactNode;
  if (mine) action = <p className="flex h-12 items-center rounded-full bg-understood/20 px-6 font-semibold">You&apos;re booked. See you there.</p>;
  else if (soldOut) action = <Button disabled data-action="book_seat">Sold out</Button>;
  else if (!open) action = <Button disabled data-action="book_seat">Opens in {shortDuration(opensInMs)}</Button>;
  else if (!loggedIn) action = <ButtonLink href="/auth/login?next=/live" data-action="book_seat">Log in to book</ButtonLink>;
  else action = <Button onClick={onBook} loading={pending} data-action="book_seat" data-event-id={e.id}>Book seat</Button>;

  return (
    <article id={e.slug} className="scroll-mt-24 rounded-card border border-line bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="teal">{e.type === "challenge" ? "Weekly challenge" : "Live session"}</Badge>
        {open && !soldOut && <Badge>Booking open</Badge>}
        {soldOut && <Badge tone="ink">Sold out</Badge>}
      </div>
      <h2 className="t-h2 mt-4">{e.title}</h2>
      <p className="mt-1 text-sm text-ink-2">
        with <span className="font-semibold text-ink">{e.host}</span>, {e.hostRole}
      </p>
      <p className="mt-4 max-w-reading">{e.description}</p>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
        <li className="flex items-center gap-2"><CalendarClock className="size-4" aria-hidden />{e.startsLabel} · {e.durationMin} min</li>
        {e.prize && <li className="flex items-center gap-2"><Trophy className="size-4 text-shaky" aria-hidden />Prize: {e.prize}</li>}
      </ul>

      <div className="mt-6 grid gap-6 border-t border-line pt-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-6">
          {!open && <Countdown ms={opensInMs} label="Booking opens in" />}
          <SeatBar total={e.seatsTotal} booked={Math.min(booked, e.seatsTotal)} />
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          {action}
          {message && <p role="status" className="text-sm font-medium">{message}</p>}
        </div>
      </div>
    </article>
  );
}
