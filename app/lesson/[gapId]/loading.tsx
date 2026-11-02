import { Pip } from "@/components/teach/Pip";
import { Skeleton } from "@/components/ui/Skeleton";

export default function LessonLoading() {
  return (
    <div className="gutter mx-auto max-w-reading py-12" aria-busy="true">
      <div className="flex items-center gap-3 text-ink-2">
        <Pip state="thinking" size={48} decorative />
        <p role="status">Writing a lesson for your exact gap…</p>
      </div>
      <Skeleton className="mt-6 h-11 w-3/4" />
      <Skeleton className="mt-6 h-20 w-full" />
      <Skeleton className="mt-8 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-11/12" />
      <Skeleton className="mt-3 h-4 w-4/5" />
      <Skeleton className="mt-8 h-40 w-full" />
    </div>
  );
}
