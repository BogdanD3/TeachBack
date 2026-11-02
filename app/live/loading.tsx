import { Skeleton } from "@/components/ui/Skeleton";

export default function LiveLoading() {
  return (
    <div className="gutter mx-auto max-w-content py-12" aria-busy="true" aria-label="Loading live events">
      <Skeleton className="h-11 w-2/3" />
      <Skeleton className="mt-4 h-5 w-1/2" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="mt-6 h-72 w-full" />
      ))}
    </div>
  );
}
