import { Skeleton } from "@/components/ui/Skeleton";

export default function LibraryLoading() {
  return (
    <div className="gutter mx-auto max-w-content py-12" aria-busy="true" aria-label="Loading topics">
      <Skeleton className="h-11 w-2/3" />
      <Skeleton className="mt-4 h-5 w-1/2" />
      <Skeleton className="mt-8 h-12 w-full" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}
