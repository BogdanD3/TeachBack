import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Runs before loading.tsx streams: unknown or someone else's concept state is a real HTTP 404.
export default async function LessonLayout({ children, params }: { children: React.ReactNode; params: Promise<{ gapId: string }> }) {
  const cs = await db.conceptState.findUnique({ where: { id: (await params).gapId }, select: { userId: true } });
  if (!cs) notFound();
  const user = await getCurrentUser();
  if (user && user.id !== cs.userId) notFound();
  return children;
}
