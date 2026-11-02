"use client";

import { usePathname } from "next/navigation";

/** Hides the site header/footer on focused full-screen pages (the teach session). */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/teach/")) return null;
  return <>{children}</>;
}
