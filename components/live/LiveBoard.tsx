"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client/post-json";
import type { SeatInfo } from "@/lib/live";
import { EventCard, type LiveEventView } from "./EventCard";

type Props = { events: LiveEventView[]; initialSeats: SeatInfo[]; serverNow: string; loggedIn: boolean };

/** Polls seat counts every 2s and ticks countdowns every second (corrected for server clock). */
export function LiveBoard({ events, initialSeats, serverNow, loggedIn }: Props) {
  const [seats, setSeats] = useState(() => new Map(initialSeats.map((s) => [s.id, s])));
  const [offset, setOffset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const [now, setNow] = useState(() => new Date(serverNow).getTime());
  const [pending, setPending] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const offsetRef = useRef(offset);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now() + offsetRef.current), 1000);
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/live/seats", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const data = (await res.json()) as { now: string; events: SeatInfo[] };
        setOffset(new Date(data.now).getTime() - Date.now());
        setSeats(new Map(data.events.map((s) => [s.id, s])));
      } catch {
        /* offline: keep last known counts */
      }
    }
    const poller = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(tick);
      clearInterval(poller);
    };
  }, []);

  async function book(id: string) {
    setPending(id);
    setMessages((m) => ({ ...m, [id]: "" }));
    const res = await postJson<{ seatsLeft: number }>(`/api/live/${id}/book`, {}, { onRetry: () => book(id) });
    setPending(null);
    setSeats((prev) => {
      const next = new Map(prev);
      const s = next.get(id);
      if (s && (res.ok || (!res.ok && res.error === "already_booked"))) {
        next.set(id, { ...s, mine: true, booked: res.ok ? s.booked + 1 : s.booked });
      }
      return next;
    });
    if (!res.ok && res.error !== "challenge" && res.error !== "blocked") setMessages((m) => ({ ...m, [id]: res.message }));
  }

  return (
    <ul className="space-y-6">
      {events.map((e) => {
        const s = seats.get(e.id);
        const opensInMs = s ? new Date(s.bookingOpensAt).getTime() - now : 0;
        return (
          <li key={e.id}>
            <EventCard
              e={e}
              booked={s?.booked ?? 0}
              mine={s?.mine ?? false}
              opensInMs={opensInMs}
              loggedIn={loggedIn}
              pending={pending === e.id}
              message={messages[e.id]}
              onBook={() => book(e.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
