import { SeatBar } from "@/components/live/SeatBar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatDateTime } from "@/lib/format";
import { LiveCountdown } from "./LiveCountdown";

type Event = { slug: string; title: string; host: string; startsAt: Date; bookingOpensAt: Date; seatsTotal: number; booked: number; type: string };

export function LiveTeaser({ event, serverNow }: { event: Event | null; serverNow: string }) {
  if (!event) return null;
  const opensLater = event.bookingOpensAt.getTime() > new Date(serverNow).getTime();
  return (
    <section aria-labelledby="live-h" className="gutter mx-auto max-w-content py-16 md:py-24">
      <div className="grid gap-8 rounded-card border border-line bg-white p-6 md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div>
          <Badge tone="teal">{event.type === "challenge" ? "Weekly challenge" : "Live session"}</Badge>
          <h2 id="live-h" className="t-h2 mt-4">{event.title}</h2>
          <p className="mt-2 text-ink-2">
            With {event.host} · {formatDateTime(event.startsAt)}
          </p>
          <div className="mt-6">
            <SeatBar total={event.seatsTotal} booked={Math.min(event.booked, event.seatsTotal)} />
          </div>
        </div>
        <div className="flex flex-col gap-6 md:items-end">
          {opensLater && <LiveCountdown target={event.bookingOpensAt.toISOString()} serverNow={serverNow} label="Booking opens in" />}
          <ButtonLink href={`/live#${event.slug}`} data-action="live_teaser">
            {opensLater ? "See live sessions" : "Book a seat"}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
