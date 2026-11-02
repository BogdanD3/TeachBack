"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";

/** Shared body for app/**\/error.tsx files. */
export function RouteError({ error, reset, title }: { error: Error & { digest?: string }; reset: () => void; title?: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="gutter mx-auto max-w-content py-12">
      <ErrorState title={title} action={<Button onClick={reset}>Try again</Button>} />
    </div>
  );
}
