import { Skeleton } from "@/components/ui/Skeleton";

/** Generic page skeleton for loading.tsx files: title, intro and a few blocks. */
export function PageSkeleton({ label, blocks = 3, width = "max-w-[880px]" }: { label: string; blocks?: number; width?: string }) {
  return (
    <div className={`gutter mx-auto ${width} py-12`} aria-busy="true" aria-label={label}>
      <Skeleton className="h-11 w-2/3" />
      <Skeleton className="mt-4 h-5 w-1/2" />
      {Array.from({ length: blocks }, (_, i) => (
        <Skeleton key={i} className="mt-8 h-36 w-full" />
      ))}
    </div>
  );
}
