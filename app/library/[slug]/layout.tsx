import { notFound } from "next/navigation";
import { db } from "@/lib/db";

// Runs before loading.tsx streams, so an unknown topic is a real HTTP 404 (BotLens counts 404s).
export default async function TopicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await db.topic.findFirst({ where: { OR: [{ slug }, { id: slug }] }, select: { id: true } }))) notFound();
  return children;
}
