import { db } from "./db";

/** Events still worth showing: upcoming, or started less than 3 hours ago. */
const visibleSince = () => new Date(Date.now() - 3 * 3600_000);

export function visibleEvents() {
  return db.liveEvent.findMany({ where: { startsAt: { gt: visibleSince() } }, orderBy: [{ startsAt: "asc" }] });
}

export type SeatInfo = { id: string; booked: number; seatsLeft: number; mine: boolean; bookingOpensAt: string; startsAt: string };

/** Live seat counts for every upcoming event (polled every 2s by /live). */
export async function seatInfo(userId?: string): Promise<SeatInfo[]> {
  const events = await db.liveEvent.findMany({
    where: { startsAt: { gt: visibleSince() } },
    include: { _count: { select: { bookings: true } }, ...(userId ? { bookings: { where: { userId }, select: { id: true } } } : {}) },
    orderBy: { startsAt: "asc" },
  });
  return events.map((e) => ({
    id: e.id,
    booked: e._count.bookings,
    seatsLeft: Math.max(0, e.seatsTotal - e._count.bookings),
    mine: "bookings" in e && Array.isArray(e.bookings) && e.bookings.length > 0,
    bookingOpensAt: e.bookingOpensAt.toISOString(),
    startsAt: e.startsAt.toISOString(),
  }));
}
