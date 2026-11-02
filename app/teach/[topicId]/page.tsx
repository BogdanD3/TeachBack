import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TeachSession } from "@/components/teach/TeachSession";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { pipOpening } from "@/lib/prompts";
import { findTopic, splitCovered } from "@/lib/topics";

type Props = { params: Promise<{ topicId: string }>; searchParams: Promise<{ new?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await findTopic((await params).topicId);
  return { title: topic ? `Teach ${topic.title}` : "Teach", robots: { index: false } };
}

export default async function TeachPage({ params, searchParams }: Props) {
  const { topicId } = await params;
  const { new: fresh } = await searchParams;
  const user = await requireUser(`/teach/${topicId}`);
  const topic = await findTopic(topicId);
  if (!topic) notFound();

  if (fresh) {
    // "Teach Pip again": close any open session on this topic and start clean.
    await db.teachSession.updateMany({ where: { userId: user.id, topicId: topic.id, status: "active" }, data: { status: "abandoned" } });
    redirect(`/teach/${topic.slug}`);
  }

  let session = await db.teachSession.findFirst({
    where: { userId: user.id, topicId: topic.id, status: "active" },
    orderBy: { startedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  session ??= await db.teachSession.create({
    data: { userId: user.id, topicId: topic.id, messages: { create: { role: "pip", content: pipOpening(topic.title), confused: true } } },
    include: { messages: true },
  });

  return (
    <TeachSession
      sessionId={session.id}
      topic={{ slug: topic.slug, title: topic.title, concepts: topic.concepts.map((c) => c.name) }}
      initialMessages={session.messages.map((m) => ({ id: m.id, role: m.role as "teacher" | "pip", content: m.content, confused: m.confused }))}
      initialCovered={splitCovered(session.covered)}
    />
  );
}
