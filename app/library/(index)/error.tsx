"use client";

import { RouteError } from "@/components/RouteError";

export default function LibraryError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="The library didn't load" />;
}
