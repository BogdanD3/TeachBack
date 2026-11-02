"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { HeaderUser } from "./nav-links";
import { userLinks } from "./user-links";

export function UserMenu({ user }: { user: NonNullable<HeaderUser> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-11 items-center gap-2 rounded-full pl-1 pr-3 hover:bg-paper-2"
      >
        <Avatar name={user.name} size="sm" />
        <span className="max-w-32 truncate text-sm font-semibold">{user.name.split(" ")[0]}</span>
        <ChevronDown className="size-4" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 w-56 rounded-card border border-line bg-white p-2 shadow-stack">
          {userLinks.map((l) => (
            <Link
              key={l.href}
              role="menuitem"
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-paper-2"
            >
              {l.label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="post" id="logout-form" name="logout-form" className="mt-1 border-t border-line pt-1">
            <button
              type="submit"
              role="menuitem"
              data-action="logout"
              className="flex h-11 w-full items-center rounded-lg px-3 text-sm font-medium text-coral-dark hover:bg-paper-2"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
