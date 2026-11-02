import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in", description: "Log in to keep teaching Pip." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pip has been waiting. Log in to pick up where you left off."
      aside={
        <div className="mt-6 max-w-sm rounded-card border border-line bg-white p-4 text-sm">
          <p className="t-meta text-ink-2">Demo account</p>
          <p className="mt-1 font-mono">demo@teachback.app · demo1234</p>
        </div>
      }
    >
      <LoginForm next={next ? safeNext(next) : undefined} />
      <p className="mt-6 rounded-card border border-line bg-paper-2 p-3 text-center text-sm md:hidden">
        Demo: <span className="font-mono">demo@teachback.app</span> / <span className="font-mono">demo1234</span>
      </p>
    </AuthShell>
  );
}
