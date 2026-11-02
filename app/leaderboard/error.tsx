"use client";

import { RouteError } from "@/components/RouteError";

export default function LeaderboardError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="The leaderboard didn't load" />;
}
