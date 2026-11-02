"use client";

import { RouteError } from "@/components/RouteError";

export default function LiveError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="Live events didn't load" />;
}
