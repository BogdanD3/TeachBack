"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { Input } from "@/components/ui/Input";
import { postJson } from "@/lib/client/post-json";

export function SignupForm({ referralCode, next }: { referralCode?: string; next?: string }) {
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
    const res = await postJson<{ redirect: string }>("/api/auth/signup", {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      ref: form.get("ref") || null,
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
    <form id="signup-form" name="signup-form" onSubmit={onSubmit} noValidate className="space-y-5">
      <Input id="signup-name" name="name" label="Your name" autoComplete="name" required error={fields.name} />
      <Input id="signup-email" name="email" type="email" label="Email" autoComplete="email" required error={fields.email} />
      <Input
        id="signup-password"
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        hint="At least 8 characters."
        required
        error={fields.password}
      />
      <input type="hidden" id="signup-ref" name="ref" value={referralCode ?? ""} />
      <FieldError>{error}</FieldError>
      <Button type="submit" fullWidth loading={pending} data-action="signup">
        Start my free trial
      </Button>
      <p className="text-center text-sm text-ink-2">
        7 days of Pro, no card needed. Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-coral-dark underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
