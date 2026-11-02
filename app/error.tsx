"use client";

import { RouteError } from "@/components/RouteError";

export default function AppError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="Something broke on our side" />;
}
