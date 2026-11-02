import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Pill, type ConceptStateName } from "@/components/ui/Pill";
import { Stars } from "@/components/ui/Stars";
import { DifficultyDots } from "./DifficultyDots";

export type TopicCardData = {
  slug: string;
  title: string;
  subject: string;
  summary: string;
  difficulty: number;
  rating: number;
  ratingCount: number;
  concepts: { name: string; state?: ConceptStateName }[];
};

export function TopicCard({ topic }: { topic: TopicCardData }) {
  const shown = topic.concepts.slice(0, 3);
  const more = topic.concepts.length - shown.length;
  return (
    <article className="lift flex flex-col rounded-card border border-line bg-white p-6">
      <p className="t-meta text-ink-2">{topic.subject}</p>
      <h3 className="t-h3 mt-2">
        <Link href={`/library/${topic.slug}`} className="hover:underline underline-offset-4">
          {topic.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-ink-2">{topic.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Key concepts">
        {shown.map((c) => (
          <li key={c.name} className="max-w-full">
            <Pill state={c.state ?? "neutral"}>{c.name}</Pill>
          </li>
        ))}
        {more > 0 && <li className="self-center text-xs text-ink-2">+{more} more</li>}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
        <div className="flex flex-col gap-1">
          <DifficultyDots level={topic.difficulty} />
          <Stars value={topic.rating} count={topic.ratingCount} />
        </div>
        <ButtonLink href={`/teach/${topic.slug}`} size="sm" data-action="start_teach" aria-label={`Teach ${topic.title} to Pip`}>
          Teach this
        </ButtonLink>
      </div>
    </article>
  );
}
