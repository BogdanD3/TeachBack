import type { Metadata } from "next";
import Link from "next/link";
import { MapNode, type MapConcept } from "@/components/map/MapNode";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Highlight } from "@/components/ui/Highlight";
import { Pill, type ConceptStateName } from "@/components/ui/Pill";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Understanding Map" };

export default async function MapPage() {
  const user = await requireUser("/map");
  const states = await db.conceptState.findMany({ where: { userId: user.id }, include: { concept: true, lesson: { select: { id: true } } } });
  const byConcept = new Map(states.map((s) => [s.conceptId, s]));
  const topicIds = [...new Set(states.map((s) => s.concept.topicId))];
  const topics = await db.topic.findMany({ where: { id: { in: topicIds } }, include: { concepts: { orderBy: { order: "asc" } } }, orderBy: { title: "asc" } });

  const counts = { understood: 0, shaky: 0, gap: 0 };
  for (const s of states) counts[s.state as keyof typeof counts]++;

  return (
    <div className="gutter mx-auto max-w-content py-8 md:py-12">
      <h1 className="t-h1">
        Your Understanding <Highlight>Map</Highlight>
      </h1>
      <p className="mt-3 max-w-reading text-ink-2">Every concept you&apos;ve explained to Pip. Tap one to see what you said and when.</p>

      <ul className="mt-6 flex flex-wrap gap-3" aria-label="Legend">
        <li><Pill state="understood">Understood · {counts.understood}</Pill></li>
        <li><Pill state="shaky">Shaky · {counts.shaky}</Pill></li>
        <li><Pill state="gap">Gap · {counts.gap}</Pill></li>
        <li><Pill state="neutral">Not taught yet</Pill></li>
      </ul>

      {topics.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your map is empty"
            body="Teach Pip your first topic. Every concept you explain shows up here."
            action={<ButtonLink href="/library">Pick a topic</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {topics.map((t) => {
            const nodes: MapConcept[] = t.concepts.map((c) => {
              const s = byConcept.get(c.id);
              return s
                ? { name: c.name, state: s.state as ConceptStateName, stateId: s.id, evidence: s.evidence, feedback: s.feedback, updated: formatDate(s.updatedAt), hasLesson: Boolean(s.lesson), topicSlug: t.slug }
                : { name: c.name, state: "neutral", topicSlug: t.slug };
            });
            const solid = nodes.filter((n) => n.state === "understood").length;
            return (
              <section key={t.id} aria-labelledby={`map-${t.slug}`} className="rounded-card border border-line bg-white p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id={`map-${t.slug}`} className="t-h3">
                    <Link href={`/library/${t.slug}`} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                      {t.title}
                    </Link>
                  </h2>
                  <p className="t-meta text-ink-2">
                    {solid}/{nodes.length} solid
                  </p>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {nodes.map((n) => (
                    <li key={n.name} className="max-w-full">
                      <MapNode c={n} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
