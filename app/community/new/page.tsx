import type { Metadata } from "next";
import { ThreadForm } from "@/components/community/ThreadForm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Start a thread" };

export default async function NewThreadPage() {
  await requireUser("/community/new");
  const topics = await db.topic.findMany({ select: { slug: true, title: true }, orderBy: { title: "asc" } });
  return (
    <div className="gutter mx-auto max-w-reading py-8 md:py-12">
      <h1 className="t-h1">Start a thread</h1>
      <p className="mt-2 text-ink-2">Ask how others explain something, or share what finally made it click.</p>
      <div className="mt-8">
        <ThreadForm topics={topics} />
      </div>
    </div>
  );
}
