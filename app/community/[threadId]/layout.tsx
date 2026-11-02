import { notFound } from "next/navigation";
import { db } from "@/lib/db";

// Runs before loading.tsx streams, so an unknown thread is a real HTTP 404 (BotLens counts 404s).
export default async function ThreadLayout({ children, params }: { children: React.ReactNode; params: Promise<{ threadId: string }> }) {
  if (!(await db.thread.findUnique({ where: { id: (await params).threadId }, select: { id: true } }))) notFound();
  return children;
}
