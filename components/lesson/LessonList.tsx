import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Pill, type ConceptStateName } from "@/components/ui/Pill";
import { timeAgo } from "@/lib/format";
import type { LessonLink } from "@/lib/lessons";

/** List of the user's lessons (dashboard, topic page). */
export function LessonList({ lessons, showTopic = true }: { lessons: LessonLink[]; showTopic?: boolean }) {
  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-white">
      {lessons.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="group flex min-h-11 items-center gap-3 p-4" data-action="open_lesson">
            <BookOpen className="size-5 shrink-0 text-coral-dark" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium underline-offset-4 group-hover:underline">{l.title}</span>
              <span className="block truncate text-xs text-ink-2">
                {showTopic ? `${l.topic} · ` : ""}
                {l.concept !== l.title ? `${l.concept} · ` : ""}
                {timeAgo(l.createdAt)}
              </span>
            </span>
            <Pill state={l.state as ConceptStateName} className="shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
