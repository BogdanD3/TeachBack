import { Prisma } from "@prisma/client";
import { apiError, botGuard, json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const blocked = await botGuard(req, "book_seat");
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return apiError(401, "unauthorized", "Log in to book a seat.");

  const { eventId } = await params;
  const event = await db.liveEvent.findUnique({ where: { id: eventId } });
  if (!event) return apiError(404, "not_found", "This event doesn't exist.");
  if (event.bookingOpensAt > new Date()) return apiError(409, "not_open", "Booking hasn't opened yet.");
  if (event.startsAt < new Date()) return apiError(409, "started", "This event has already started.");

  // Insert first, then verify the count: safe against two people grabbing the last seat at once.
  try {
    await db.booking.create({ data: { eventId, userId: user.id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return apiError(409, "already_booked", "You already have a seat for this event.");
    }
    throw e;
  }
  const booked = await db.booking.count({ where: { eventId } });
  if (booked > event.seatsTotal) {
    await db.booking.deleteMany({ where: { eventId, userId: user.id } });
    return apiError(409, "sold_out", "Sorry, the last seat just went.");
  }
  return json({ ok: true, seatsLeft: event.seatsTotal - booked }, 201);
}
