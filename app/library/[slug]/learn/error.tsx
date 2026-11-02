"use client";

import { RouteError } from "@/components/RouteError";

export default function PrimerError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="The primer didn't load" />;
}
