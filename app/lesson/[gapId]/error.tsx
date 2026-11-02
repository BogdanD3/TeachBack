"use client";

import { RouteError } from "@/components/RouteError";

export default function LessonError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="The lesson didn't load" />;
}
