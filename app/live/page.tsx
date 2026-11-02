import type { Metadata } from "next";
import { LiveBoard } from "@/components/live/LiveBoard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Highlight } from "@/components/ui/Highlight";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { seatInfo, visibleEvents } from "@/lib/live";

export const metadata: Metadata = {
  title: "Live sessions and weekly challenges",
  description: "Thirty seats per event. Explain a topic to Pip live, with a host and an audience.",
};

export default async function LivePage() {
  const user = await getCurrentUser();
  const [events, seats] = await Promise.all([
    visibleEvents(),
    seatInfo(user?.id),
  ]);

  return (
    <div className="gutter mx-auto max-w-content py-8 md:py-12">
      <p className="t-meta text-teal">Live</p>
      <h1 className="t-h1 mt-2">
        Teach Pip in front of a <Highlight>real</Highlight> room
      </h1>
      <p className="mt-3 max-w-reading text-ink-2">
        Live sessions with a host, and weekly challenges with prizes. Every event has 30 seats. They go fast once booking opens.
      </p>
      <div className="mt-8">
        {events.length === 0 ? (
          <EmptyState title="No live events right now" body="New sessions are announced every Monday. Check back soon." />
        ) : (
          <LiveBoard
            loggedIn={Boolean(user)}
            serverNow={new Date().toISOString()}
            initialSeats={seats}
            events={events.map((e) => ({
              id: e.id,
              slug: e.slug,
              title: e.title,
              type: e.type,
              host: e.host,
              hostRole: e.hostRole,
              description: e.description,
              startsLabel: formatDateTime(e.startsAt),
              durationMin: e.durationMin,
              seatsTotal: e.seatsTotal,
              prize: e.prize,
            }))}
          />
        )}
      </div>
    </div>
  );
}
