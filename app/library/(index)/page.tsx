import type { Metadata } from "next";
import { LibraryFilters } from "@/components/library/LibraryFilters";
import { TopicCard } from "@/components/library/TopicCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Highlight } from "@/components/ui/Highlight";
import type { ConceptStateName } from "@/components/ui/Pill";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUBJECTS, userConceptStates } from "@/lib/topics";

export const metadata: Metadata = {
  title: "Topic library",
  description: "Twelve topics to teach Pip, from photosynthesis to neural networks. Pick one and find your gaps.",
};

type Search = { q?: string; subject?: string; difficulty?: string; welcome?: string };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { q, subject, difficulty, welcome } = await searchParams;
  const user = await getCurrentUser();
  const level = Number(difficulty);
  const topics = await db.topic.findMany({
    where: {
      ...(q ? { OR: [{ title: { contains: q } }, { summary: { contains: q } }, { concepts: { some: { name: { contains: q } } } }] } : {}),
      ...(subject ? { subject } : {}),
      ...([1, 2, 3].includes(level) ? { difficulty: level } : {}),
    },
    include: { concepts: { orderBy: { order: "asc" } } },
    orderBy: [{ difficulty: "asc" }, { title: "asc" }],
  });
  const states = await userConceptStates(user?.id, topics.flatMap((t) => t.concepts.map((c) => c.id)));
  const filtered = Boolean(q || subject || difficulty);

  return (
    <div className="gutter mx-auto max-w-content py-12">
      {welcome && user && (
        <p className="mb-8 rounded-card border border-line bg-highlight/40 p-4">
          Welcome, {user.name.split(" ")[0]}! Your 7-day trial is on. Pick a topic you think you know, and explain it to Pip.
        </p>
      )}
      <h1 className="t-h1">
        What will you <Highlight>teach</Highlight> today?
      </h1>
      <p className="mt-3 max-w-reading text-ink-2">Pick a topic you think you know. Pip will find out if you really do.</p>
      <div className="mt-8">
        <LibraryFilters subjects={SUBJECTS} q={q} subject={subject} difficulty={difficulty} />
      </div>
      <p className="t-meta mt-8 text-ink-2" aria-live="polite">
        {topics.length} {topics.length === 1 ? "topic" : "topics"}
        {filtered ? " match" : ""}
      </p>
      {topics.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No topics match"
            body="Try a shorter search word or clear the filters."
            action={<ButtonLink href="/library" variant="secondary">Clear filters</ButtonLink>}
          />
        </div>
      ) : (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <li key={t.id} className="flex">
              <div className="w-full [&>article]:h-full">
                <TopicCard
                  topic={{
                    ...t,
                    concepts: t.concepts.map((c) => ({ name: c.name, state: states.get(c.id)?.state as ConceptStateName | undefined })),
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
