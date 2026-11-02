import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "./UserMenu";
import { navLinks, type HeaderUser } from "./nav-links";

export function SiteHeader({ user }: { user: HeaderUser }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-[2px]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <div className="gutter mx-auto flex h-16 max-w-content items-center justify-between gap-4">
        <Logo href={user ? "/dashboard" : "/"} />
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="rounded-full px-3 py-2 text-[15px] font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <ButtonLink href="/auth/login" variant="secondary" size="sm" data-action="nav_login">
                Log in
              </ButtonLink>
              <ButtonLink href="/auth/signup" size="sm" data-action="nav_signup">
                Start free trial
              </ButtonLink>
            </>
          )}
        </div>
        <MobileMenu user={user} />
      </div>
    </header>
  );
}
