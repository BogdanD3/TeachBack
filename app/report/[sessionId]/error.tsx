"use client";

import { RouteError } from "@/components/RouteError";

export default function ReportError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="Your report didn't load" />;
}
