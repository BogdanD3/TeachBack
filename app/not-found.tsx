import type { Metadata } from "next";
import { Pip } from "@/components/teach/Pip";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="gutter mx-auto flex max-w-reading flex-col items-center py-24 text-center">
      <Pip state="confused" size={140} />
      <p className="t-meta mt-6 text-ink-2">Error 404</p>
      <h1 className="t-h1 mt-2">Pip looked everywhere</h1>
      <p className="mt-3 text-ink-2">This page doesn&apos;t exist, or it moved. Pip is just as confused as you.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/library">Browse topics</ButtonLink>
        <ButtonLink href="/" variant="secondary">Go home</ButtonLink>
      </div>
    </div>
  );
}
