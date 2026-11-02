import { Skeleton } from "@/components/ui/Skeleton";

export default function ReportLoading() {
  return (
    <div className="gutter mx-auto max-w-[880px] py-12" aria-busy="true" aria-label="Loading report">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-11 w-2/3" />
      <Skeleton className="mt-8 h-40 w-full" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="mt-4 h-32 w-full" />
      ))}
    </div>
  );
}
