import { Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckQuestions } from "@/components/lesson/CheckQuestions";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pill, type ConceptStateName } from "@/components/ui/Pill";
import { AiFormatError, generateLesson } from "@/lib/ai";
import { lessonSchema, type LessonContent } from "@/lib/ai-types";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Markdown } from "@/lib/markdown";
import { aiRateLimit } from "@/lib/rate-limit";
import { findTopic, toTopicContext } from "@/lib/topics";

export const metadata: Metadata = { title: "Mini-lesson" };

function parseLesson(raw: string): LessonContent | null {
  try {
    const p = lessonSchema.safeParse(JSON.parse(raw));
    return p.success ? p.data : null;
  } catch {
    return null;
  }
}

export default async function LessonPage({ params }: { params: Promise<{ gapId: string }> }) {
  const { gapId } = await params;
  const user = await requireUser(`/lesson/${gapId}`);
  const cs = await db.conceptState.findUnique({ where: { id: gapId }, include: { concept: true, lesson: true } });
  if (!cs || cs.userId !== user.id) notFound();
  const topic = await findTopic(cs.concept.topicId);
  if (!topic) notFound();

  // Cached per concept state; regenerated when the state changed after the lesson was written.
  let lesson = cs.lesson && cs.lesson.createdAt >= cs.updatedAt ? parseLesson(cs.lesson.content) : null;
  let failure = "";
  if (!lesson) {
    if (!aiRateLimit(user.id).ok) {
      lesson = cs.lesson ? parseLesson(cs.lesson.content) : null;
      if (!lesson) failure = "You've asked for a lot of lessons in a minute. Wait a moment and reload.";
    } else {
      try {
        const content = await generateLesson(toTopicContext(topic), { name: cs.concept.name, evidence: cs.evidence, feedback: cs.feedback });
        lesson = content;
        const data = { conceptId: cs.conceptId, userId: user.id, content: JSON.stringify(content), createdAt: new Date() };
        await db.lesson.upsert({ where: { conceptStateId: cs.id }, create: { conceptStateId: cs.id, ...data }, update: data });
      } catch (e) {
        failure = e instanceof AiFormatError ? e.message : "We couldn't write this lesson right now. Try again in a moment.";
      }
    }
  }

  if (!lesson) {
    return (
      <div className="gutter mx-auto max-w-reading py-12">
        <ErrorState title="The lesson isn't ready" body={failure} action={<ButtonLink href={`/lesson/${cs.id}`}>Try again</ButtonLink>} />
      </div>
    );
  }

  return (
    <article className="gutter mx-auto max-w-reading py-8 md:py-12">
      <div className="flex flex-wrap items-center gap-3">
        <p className="t-meta text-ink-2">
          {topic.title} · {cs.concept.name}
        </p>
        <Pill state={cs.state as ConceptStateName} />
      </div>
      <h1 className="t-h1 mt-3">{lesson.title}</h1>

      <div className="mt-6 rounded-card bg-highlight p-4 md:p-6">
        <p className="t-meta">The gap</p>
        <p className="mt-1 font-semibold">{lesson.gap_summary}</p>
      </div>

      <Markdown source={lesson.body} className="mt-8 text-[17px] leading-[1.7]" />

      {lesson.example && (
        <aside className="mt-8 flex gap-3 rounded-card border border-line bg-paper-2 p-4 md:p-6" aria-label="Example">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-coral-dark" aria-hidden />
          <div>
            <p className="t-meta text-ink-2">Example</p>
            <p className="mt-1">{lesson.example}</p>
          </div>
        </aside>
      )}

      <CheckQuestions questions={lesson.questions} />

      <div className="mt-12 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row">
        <ButtonLink href={`/teach/${topic.slug}?new=1`} data-action="teach_again">
          Teach Pip again
        </ButtonLink>
        <ButtonLink href="/map" variant="secondary">
          Back to my map
        </ButtonLink>
      </div>
    </article>
  );
}
