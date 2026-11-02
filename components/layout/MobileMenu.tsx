"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { navLinks, type HeaderUser } from "./nav-links";
import { userLinks } from "./user-links";

export function MobileMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-11 place-items-center rounded-full text-ink hover:bg-paper-2"
      >
        {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
      </button>
      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-16 border-b border-line bg-paper shadow-stack">
          <nav aria-label="Mobile" className="gutter py-4">
            <ul className="flex flex-col">
              {[...navLinks, ...(user ? userLinks : [])].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex h-12 items-center rounded-card px-3 text-lg font-medium hover:bg-paper-2">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
              {user ? (
                <form action="/api/auth/logout" method="post" id="logout-form-mobile" name="logout-form-mobile">
                  <button type="submit" data-action="logout" className="h-12 w-full rounded-full border-[1.5px] border-ink font-semibold">
                    Log out
                  </button>
                </form>
              ) : (
                <>
                  <ButtonLink href="/auth/signup" fullWidth data-action="nav_signup">
                    Start free trial
                  </ButtonLink>
                  <ButtonLink href="/auth/login" variant="secondary" fullWidth data-action="nav_login">
                    Log in
                  </ButtonLink>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
