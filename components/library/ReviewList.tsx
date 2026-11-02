import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { timeAgo } from "@/lib/format";

type Review = { id: string; stars: number; text: string; createdAt: Date; user: { name: string } };

type Props = { topicSlug: string; reviews: Review[]; loggedIn: boolean; form?: React.ReactNode };

export function ReviewList({ topicSlug, reviews, loggedIn, form }: Props) {
  return (
    <section className="mt-12" aria-labelledby="reviews-h">
      <h2 id="reviews-h" className="t-h2">
        Reviews
      </h2>
      {form}
      {!loggedIn && (
        <p className="mt-4 text-sm text-ink-2">
          <Link href={`/auth/login?next=/library/${topicSlug}`} className="font-semibold text-coral-dark underline-offset-4 hover:underline">
            Log in
          </Link>{" "}
          to write a review.
        </p>
      )}
      {reviews.length === 0 ? (
        <p className="mt-6 rounded-card border border-dashed border-line p-6 text-center text-ink-2">No reviews yet. Teach it first, then tell others how it went.</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-card border border-line bg-white p-6">
              <div className="flex items-center gap-3">
                <Avatar name={r.user.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.user.name}</p>
                  <p className="text-xs text-ink-2">{timeAgo(r.createdAt)}</p>
                </div>
                <span className="ml-auto">
                  <Stars value={r.stars} />
                </span>
              </div>
              <p className="mt-3 text-sm">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
