import { Skeleton } from "@/components/ui/Skeleton";

export default function MapLoading() {
  return (
    <div className="gutter mx-auto max-w-content py-12" aria-busy="true" aria-label="Loading map">
      <Skeleton className="h-11 w-2/3" />
      <Skeleton className="mt-6 h-8 w-1/2" />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  );
}
