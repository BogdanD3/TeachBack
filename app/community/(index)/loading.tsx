import { Skeleton } from "@/components/ui/Skeleton";

export default function CommunityLoading() {
  return (
    <div className="gutter mx-auto max-w-content py-12" aria-busy="true" aria-label="Loading community">
      <Skeleton className="h-11 w-1/3" />
      <Skeleton className="mt-4 h-5 w-1/2" />
      <Skeleton className="mt-8 h-[480px] w-full" />
    </div>
  );
}
