import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Stars } from "@/components/ui/Stars";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Community", description: "Tips, questions and stories from people teaching Pip." };

export default async function CommunityPage() {
  const user = await getCurrentUser();
  const [threads, reviews] = await Promise.all([
    db.thread.findMany({ include: { topic: true, user: { select: { name: true } }, _count: { select: { replies: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.review.findMany({ include: { topic: true, user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  return (
    <div className="gutter mx-auto max-w-content py-8 md:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="t-h1">Community</h1>
          <p className="mt-2 text-ink-2">How others explain things to Pip, and where they got stuck.</p>
        </div>
        <ButtonLink href={user ? "/community/new" : "/auth/login?next=/community/new"} data-action="new_thread">
          Start a thread
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="threads-h">
          <h2 id="threads-h" className="sr-only">Threads</h2>
          {threads.length === 0 ? (
            <EmptyState title="No threads yet" body="Ask the first question." />
          ) : (
            <ul className="divide-y divide-line rounded-card border border-line bg-white">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link href={`/community/${t.id}`} className="block p-4 hover:bg-paper-2/60 md:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="outline">{t.topic?.title ?? "General"}</Badge>
                      <span className="text-xs text-ink-2">{timeAgo(t.createdAt)}</span>
                    </div>
                    <h3 className="mt-2 font-semibold md:text-lg">{t.title}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-ink-2">
                      <span>{t.user.name}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-4" aria-hidden />
                        {t._count.replies} {t._count.replies === 1 ? "reply" : "replies"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside aria-labelledby="reviews-h">
          <h2 id="reviews-h" className="t-h3">Latest topic reviews</h2>
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-card border border-line bg-white p-4">
                <div className="flex items-center gap-2">
                  <Avatar name={r.user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.user.name}</p>
                    <Link href={`/library/${r.topic.slug}`} className="text-xs text-ink-2 hover:underline">{r.topic.title}</Link>
                  </div>
                  <Stars value={r.stars} />
                </div>
                <p className="mt-2 text-sm">{r.text}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
