"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { Input, inputClasses } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { postJson } from "@/lib/client/post-json";

export function ThreadForm({ topics }: { topics: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(form: HTMLFormElement) {
    const fd = new FormData(form);
    setPending(true);
    setError("");
    setFields({});
    const res = await postJson<{ redirect: string }>(
      "/api/community/threads",
      { title: fd.get("title"), body: fd.get("body"), topic: fd.get("topic") || null },
      { onRetry: () => submit(form) },
    );
    if (res.ok) return router.push(res.data.redirect);
    setPending(false);
    setFields(res.fields ?? {});
    if (!res.fields && res.error !== "challenge" && res.error !== "blocked") setError(res.message);
  }

  return (
    <form
      id="thread-form"
      name="thread-form"
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
    >
      <Input id="thread-title" name="title" label="Title" maxLength={140} required error={fields.title} placeholder="e.g. How do you explain the Calvin cycle simply?" />
      <div>
        <Label htmlFor="thread-topic">Topic (optional)</Label>
        <select id="thread-topic" name="topic" className={inputClasses} defaultValue="">
          <option value="">General</option>
          {topics.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.title}
            </option>
          ))}
        </select>
      </div>
      <Textarea id="thread-body" name="body" label="Your question or story" rows={7} maxLength={5000} required error={fields.body} />
      <FieldError>{error}</FieldError>
      <Button type="submit" loading={pending} data-action="post_forum">
        Post thread
      </Button>
    </form>
  );
}
