"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { Textarea } from "@/components/ui/Textarea";
import { postJson } from "@/lib/client/post-json";

export function ReviewForm({ topicSlug }: { topicSlug: string }) {
  const router = useRouter();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setPending(true);
    setError("");
    const res = await postJson("/api/reviews", { topic: topicSlug, stars, text }, { onRetry: submit });
    setPending(false);
    if (res.ok) return router.refresh();
    if (res.error !== "challenge" && res.error !== "blocked") setError(res.fields ? Object.values(res.fields)[0] : res.message);
  }

  const shown = hover || stars;
  return (
    <form
      id="review-form"
      name="review-form"
      noValidate
      className="mt-6 space-y-4 rounded-card border border-line bg-paper-2 p-4 md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-full p-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="stars" value={n} checked={stars === n} onChange={() => setStars(n)} className="sr-only" />
              <Star className={`size-7 ${n <= shown ? "fill-shaky text-shaky" : "text-ink-2/50"}`} aria-hidden />
              <span className="sr-only">{n} {n === 1 ? "star" : "stars"}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Textarea id="review-text" name="text" label="Your review" rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="What did Pip catch you on?" />
      <FieldError>{error}</FieldError>
      <Button type="submit" loading={pending} disabled={!stars || text.trim().length < 10} data-action="post_review">
        Post review
      </Button>
    </form>
  );
}
