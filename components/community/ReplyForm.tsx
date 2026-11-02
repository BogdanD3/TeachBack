"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { Textarea } from "@/components/ui/Textarea";
import { postJson } from "@/lib/client/post-json";

export function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setPending(true);
    setError("");
    const res = await postJson(`/api/community/threads/${threadId}/replies`, { body }, { onRetry: submit });
    setPending(false);
    if (res.ok) {
      setBody("");
      router.refresh();
      return;
    }
    if (res.error !== "challenge" && res.error !== "blocked") setError(res.fields?.body ?? res.message);
  }

  return (
    <form
      id="reply-form"
      name="reply-form"
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Textarea id="reply-body" name="body" label="Your reply" rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={3000} />
      <FieldError>{error}</FieldError>
      <Button type="submit" loading={pending} disabled={!body.trim()} data-action="post_forum">
        Post reply
      </Button>
    </form>
  );
}
