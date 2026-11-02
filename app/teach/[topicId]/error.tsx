"use client";

import { RouteError } from "@/components/RouteError";

export default function TeachError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="Pip couldn't join the session" />;
}
