import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Runs before loading.tsx streams: unknown or someone else's session is a real HTTP 404.
export default async function ReportLayout({ children, params }: { children: React.ReactNode; params: Promise<{ sessionId: string }> }) {
  const session = await db.teachSession.findUnique({ where: { id: (await params).sessionId }, select: { userId: true } });
  if (!session) notFound();
  const user = await getCurrentUser();
  if (user && user.id !== session.userId) notFound();
  return children;
}
