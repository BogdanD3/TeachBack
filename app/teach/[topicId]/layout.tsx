import { notFound } from "next/navigation";
import { findTopic } from "@/lib/topics";

// Runs before this segment's loading.tsx starts streaming, so a bad topic is a real HTTP 404 (BotLens counts 404s).
export default async function TeachLayout({ children, params }: { children: React.ReactNode; params: Promise<{ topicId: string }> }) {
  if (!(await findTopic((await params).topicId))) notFound();
  return children;
}
