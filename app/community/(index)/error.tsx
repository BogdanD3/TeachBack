"use client";

import { RouteError } from "@/components/RouteError";

export default function CommunityError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="The forum didn't load" />;
}
