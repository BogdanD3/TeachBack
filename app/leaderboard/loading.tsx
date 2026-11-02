import { Skeleton } from "@/components/ui/Skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="gutter mx-auto max-w-[880px] py-12" aria-busy="true" aria-label="Loading leaderboard">
      <Skeleton className="h-11 w-1/2" />
      <Skeleton className="mt-8 h-28 w-full" />
      <Skeleton className="mt-8 h-96 w-full" />
    </div>
  );
}
