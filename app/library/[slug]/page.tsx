import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DifficultyDots } from "@/components/library/DifficultyDots";
import { ReviewForm } from "@/components/library/ReviewForm";
import { ReviewList } from "@/components/library/ReviewList";
import { LessonList } from "@/components/lesson/LessonList";
import { userLessons } from "@/lib/lessons";
import { timeAgo } from "@/lib/format";
import { Pip } from "@/components/teach/Pip";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Pill, type ConceptStateName } from "@/components/ui/Pill";
import { Stars } from "@/components/ui/Stars";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { findTopic, userConceptStates } from "@/lib/topics";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const topic = await findTopic((await params).slug);
  return topic ? { title: topic.title, description: topic.summary } : { title: "Topic not found" };
}

export default async function TopicPage({ params }: Params) {
  const { slug } = await params;
  const topic = await findTopic(slug);
  if (!topic) notFound();
  const user = await getCurrentUser();
  const [states, reviews, lessons] = await Promise.all([
    userConceptStates(user?.id, topic.concepts.map((c) => c.id)),
    db.review.findMany({ where: { topicId: topic.id }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    user ? userLessons(user.id, { topicId: topic.id, take: 20 }) : Promise.resolve([]),
  ]);
  const myReview = user ? reviews.find((r) => r.userId === user.id) : undefined;

  return (
    <div className="gutter mx-auto max-w-content py-8 md:py-12">
      <Link href="/library" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All topics
      </Link>
      <div className="mt-4 grid gap-12 lg:grid-cols-[1fr_320px]">
        <article>
          <p className="t-meta text-ink-2">{topic.subject}</p>
          <h1 className="t-h1 mt-2">{topic.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <DifficultyDots level={topic.difficulty} />
            <Stars value={topic.rating} count={topic.ratingCount} />
          </div>
          <p className="mt-6 max-w-reading text-lg">{topic.summary}</p>
          <p className="mt-4 max-w-reading text-ink-2">{topic.intro}</p>

          <section className="mt-12" aria-labelledby="concepts-h">
            <h2 id="concepts-h" className="t-h2">
              What you&apos;ll need to explain
            </h2>
            <ol className="mt-6 divide-y divide-line rounded-card border border-line bg-white">
              {topic.concepts.map((c, i) => {
                const st = states.get(c.id);
                return (
                  <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4 md:p-6">
                    <span className="t-meta w-8 shrink-0 pt-1 text-ink-2">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{c.name}</h3>
                      <p className="mt-1 text-sm text-ink-2">{c.description}</p>
                    </div>
                    {user && <Pill state={(st?.state as ConceptStateName | undefined) ?? "neutral"} className="self-start" />}
                  </li>
                );
              })}
            </ol>
          </section>

          {lessons.length > 0 && (
            <section className="mt-12" aria-labelledby="my-lessons-h">
              <h2 id="my-lessons-h" className="t-h2">
                Your lessons
              </h2>
              <p className="mt-2 text-ink-2">Lessons written for your gaps in {topic.title}.</p>
              <div className="mt-6">
                <LessonList lessons={lessons} showTopic={false} />
              </div>
            </section>
          )}

          <ReviewList
            topicSlug={topic.slug}
            reviews={reviews}
            loggedIn={Boolean(user)}
            form={
              user && !myReview ? (
                <ReviewForm topicSlug={topic.slug} />
              ) : myReview ? (
                <p className="mt-4 text-sm text-ink-2">Thanks — you reviewed this topic {timeAgo(myReview.createdAt)}.</p>
              ) : null
            }
          />
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-line bg-paper-2 p-6 text-center">
            <Pip state="confused" size={96} className="mx-auto" />
            <p className="mt-4 font-semibold">Pip has never heard of {topic.title.toLowerCase()}.</p>
            <p className="mt-1 text-sm text-ink-2">Explain it in your own words. About 10 minutes.</p>
            <div className="mt-6 flex flex-col gap-3" role="group" aria-label="How do you want to start?">
              <ButtonLink href={`/teach/${topic.slug}`} fullWidth data-action="start_teach">
                I know this, let me teach
              </ButtonLink>
              <ButtonLink href={`/library/${topic.slug}/learn`} variant="secondary" size="lg" fullWidth data-action="open_primer" className="flex-col gap-0! leading-tight">
                <span>Quick primer first</span>
                <span className="t-meta font-normal text-ink-2">2–3 min read</span>
              </ButtonLink>
              <ButtonLink href={`/library/${topic.slug}/learn?depth=full`} variant="ghost" size="lg" fullWidth data-action="open_primer_full" className="flex-col gap-0! leading-tight">
                <span>Teach me from scratch</span>
                <span className="t-meta font-normal text-ink-2">~6 min read</span>
              </ButtonLink>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
