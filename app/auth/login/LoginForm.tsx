"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { Input } from "@/components/ui/Input";
import { postJson } from "@/lib/client/post-json";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    setFields({});
    const res = await postJson<{ redirect: string }>("/api/auth/login", {
      email: form.get("email"),
      password: form.get("password"),
      next,
    });
    if (res.ok) {
      router.push(res.data.redirect);
      router.refresh();
      return;
    }
    setPending(false);
    setFields(res.fields ?? {});
    if (!res.fields) setError(res.message);
  }

  return (
    <form id="login-form" name="login-form" onSubmit={onSubmit} noValidate className="space-y-5">
      <Input id="login-email" name="email" type="email" label="Email" autoComplete="email" required error={fields.email} />
      <Input id="login-password" name="password" type="password" label="Password" autoComplete="current-password" required error={fields.password} />
      <FieldError>{error}</FieldError>
      <Button type="submit" fullWidth loading={pending} data-action="login">
        Log in
      </Button>
      <p className="text-center text-sm text-ink-2">
        New here?{" "}
        <Link href={next ? `/auth/signup?next=${encodeURIComponent(next)}` : "/auth/signup"} className="font-semibold text-coral-dark underline-offset-4 hover:underline">
          Start your 7-day free trial
        </Link>
      </p>
    </form>
  );
}
