import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReplyForm } from "@/components/community/ReplyForm";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";

type Params = { params: Promise<{ threadId: string }> };

const load = (id: string) =>
  db.thread.findUnique({
    where: { id },
    include: { topic: true, user: { select: { name: true } }, replies: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } } },
  });

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = await load((await params).threadId);
  return { title: t?.title ?? "Thread not found" };
}

export default async function ThreadPage({ params }: Params) {
  const { threadId } = await params;
  const [thread, user] = await Promise.all([load(threadId), getCurrentUser()]);
  if (!thread) notFound();

  return (
    <div className="gutter mx-auto max-w-reading py-8 md:py-12">
      <Link href="/community" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Community
      </Link>
      <article className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {thread.topic ? (
            <Link href={`/library/${thread.topic.slug}`}><Badge tone="outline">{thread.topic.title}</Badge></Link>
          ) : (
            <Badge tone="outline">General</Badge>
          )}
        </div>
        <h1 className="t-h2 mt-3">{thread.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-ink-2">
          <Avatar name={thread.user.name} size="sm" />
          <span className="font-semibold text-ink">{thread.user.name}</span>
          <span>{timeAgo(thread.createdAt)}</span>
        </div>
        <p className="mt-6 whitespace-pre-wrap">{thread.body}</p>
      </article>

      <section aria-labelledby="replies-h" className="mt-12">
        <h2 id="replies-h" className="t-h3">
          {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
        </h2>
        {thread.replies.length === 0 ? (
          <p className="mt-4 text-ink-2">No replies yet. Be the first to help.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {thread.replies.map((r) => (
              <li key={r.id} className="rounded-card border border-line bg-white p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Avatar name={r.user.name} size="sm" />
                  <span className="font-semibold">{r.user.name}</span>
                  <span className="text-ink-2">{timeAgo(r.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8 border-t border-line pt-8">
          {user ? (
            <ReplyForm threadId={thread.id} />
          ) : (
            <p className="text-ink-2">
              <Link href={`/auth/login?next=/community/${thread.id}`} className="font-semibold text-coral-dark underline-offset-4 hover:underline">Log in</Link> to reply.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
