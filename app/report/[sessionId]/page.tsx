import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConceptResult } from "@/components/report/ConceptResult";
import { ScoreRing } from "@/components/report/ScoreRing";
import { Pip } from "@/components/teach/Pip";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readEvaluation } from "@/lib/evaluation";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Gap report", robots: { index: false } };

const order = { gap: 0, shaky: 1, understood: 2 } as const;

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const user = await requireUser(`/report/${sessionId}`);
  const session = await db.teachSession.findUnique({ where: { id: sessionId }, include: { topic: { include: { concepts: true } } } });
  if (!session || session.userId !== user.id) notFound();

  const ev = readEvaluation(session.evaluation);
  if (session.status !== "finished" || !ev) {
    return (
      <div className="gutter mx-auto max-w-reading py-12">
        <EmptyState
          title="This session isn't finished yet"
          body="Finish the session and Pip will write your gap report."
          action={<ButtonLink href={`/teach/${session.topic.slug}`}>Back to the session</ButtonLink>}
        />
      </div>
    );
  }

  const states = await db.conceptState.findMany({ where: { userId: user.id, conceptId: { in: session.topic.concepts.map((c) => c.id) } } });
  const idByName = new Map(session.topic.concepts.map((c) => [c.name, states.find((s) => s.conceptId === c.id)?.id]));
  const concepts = [...ev.concepts].sort((a, b) => order[a.state] - order[b.state]);

  return (
    <div className="gutter mx-auto max-w-[880px] py-8 md:py-12">
      <p className="t-meta text-ink-2">
        Gap report · {formatDate(session.finishedAt ?? session.startedAt)}
        {ev.source === "demo" && " · demo mode"}
      </p>
      <h1 className="t-h1 mt-2">{session.topic.title}</h1>

      <div className="mt-8 flex flex-col gap-6 rounded-card border border-line bg-paper-2 p-6 md:flex-row md:items-center md:justify-between">
        <ScoreRing score={ev.score} total={ev.concepts.length} />
        <p className="flex items-center gap-2 self-start rounded-full bg-highlight px-4 py-2 text-sm font-semibold md:self-center">
          <Sparkles className="size-4" aria-hidden />+{ev.pointsAwarded} points
          {ev.gapsClosed.length > 0 && ` · ${ev.gapsClosed.length} gap${ev.gapsClosed.length > 1 ? "s" : ""} closed`}
        </p>
      </div>

      <h2 className="t-h2 mt-12">Concept by concept</h2>
      <ul className="mt-6 space-y-4">
        {concepts.map((c) => (
          <ConceptResult key={c.name} {...c} conceptStateId={idByName.get(c.name)} />
        ))}
      </ul>

      <section aria-labelledby="pip-says" className="mt-12 flex flex-col items-center gap-4 rounded-card border border-line bg-white p-6 text-center sm:flex-row sm:text-left">
        <Pip state={ev.score === ev.concepts.length ? "got-it" : "confused"} size={88} />
        <div>
          <h2 id="pip-says" className="t-meta text-ink-2">
            Pip says
          </h2>
          <p className="mt-1 font-display text-xl">“{ev.pip_summary}”</p>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/teach/${session.topic.slug}?new=1`} data-action="teach_again">
          Teach Pip again
        </ButtonLink>
        <ButtonLink href="/map" variant="secondary">
          See your Understanding Map
        </ButtonLink>
      </div>
    </div>
  );
}
