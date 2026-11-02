"use client";

import { useEffect, useState } from "react";
import { Countdown } from "@/components/live/Countdown";

/** Ticking countdown to a fixed moment, corrected for the server clock. */
export function LiveCountdown({ target, serverNow, label }: { target: string; serverNow: string; label: string }) {
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const [now, setNow] = useState(() => new Date(serverNow).getTime());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);
  const ms = new Date(target).getTime() - now;
  if (ms <= 0) return <p className="t-h3 text-teal">Booking is open now</p>;
  return <Countdown ms={ms} label={label} />;
}
