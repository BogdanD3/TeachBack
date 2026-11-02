import { Gift } from "lucide-react";
import type { Metadata } from "next";
import { ClaimButton } from "@/components/referral/ClaimButton";
import { CopyLink } from "@/components/referral/CopyLink";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Highlight } from "@/components/ui/Highlight";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requestOrigin } from "@/lib/origin";

export const metadata: Metadata = { title: "Invite friends", description: "Invite a friend to Teachback and you both get a free week." };

const steps = ["Send your link to a friend.", "They sign up and start their free trial.", "You claim a free week here. One per friend, no limit."];

export default async function ReferralPage() {
  const user = await requireUser("/referral");
  const friends = await db.user.findMany({ where: { referredById: user.id }, select: { id: true, name: true, createdAt: true, referralClaimed: true }, orderBy: { createdAt: "desc" } });
  const pending = friends.filter((f) => !f.referralClaimed).length;
  const url = `${await requestOrigin()}/signup?ref=${user.referralCode}`;

  return (
    <div className="gutter mx-auto max-w-[880px] py-8 md:py-12">
      <h1 className="t-h1">
        Invite a friend, get a <Highlight>free week</Highlight>
      </h1>
      <p className="mt-3 max-w-reading text-ink-2">Teaching is better with company. Every friend who joins with your link gives you one free week of Pro.</p>

      <section className="mt-8 rounded-card border border-line bg-white p-6" aria-labelledby="link-h">
        <h2 id="link-h" className="t-h3">Your personal link</h2>
        <div className="mt-4"><CopyLink url={url} /></div>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="text-sm">
              <span className="t-meta text-ink-2">Step {i + 1}</span>
              <p className="mt-1">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 flex flex-col gap-4 rounded-card bg-paper-2 p-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="reward-h">
        <div className="flex items-center gap-3">
          <Gift className="size-8 text-coral-dark" aria-hidden />
          <div>
            <h2 id="reward-h" className="font-semibold">{user.bonusDays} free {user.bonusDays === 1 ? "day" : "days"} earned so far</h2>
            <p className="text-sm text-ink-2">1 free week per friend.</p>
          </div>
        </div>
        <ClaimButton count={pending} />
      </section>

      <section className="mt-8" aria-labelledby="friends-h">
        <h2 id="friends-h" className="t-h3">Friends who joined ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="mt-4 rounded-card border border-dashed border-line p-6 text-center text-ink-2">No one yet. Share your link with a study buddy.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-white">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center gap-3 p-4">
                <Avatar name={f.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{f.name}</p>
                  <p className="text-xs text-ink-2">Joined {formatDate(f.createdAt)}</p>
                </div>
                {f.referralClaimed ? <Badge tone="outline">Week claimed</Badge> : <Badge>Ready to claim</Badge>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
