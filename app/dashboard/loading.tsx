import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="gutter mx-auto max-w-content py-12" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-11 w-1/3" />
      <Skeleton className="mt-4 h-8 w-1/2" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    </div>
  );
}
