import { PrismaClient, type Concept, type Topic, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { demoLesson } from "../lib/demo-responses";
import { threads, reviewTexts } from "./seed-data/community";
import { liveEvents } from "./seed-data/events";
import { people, emailDomains } from "./seed-data/people";
import { topics } from "./seed-data/topics";

const db = new PrismaClient();
const DAY = 86_400_000;
const POINTS_SESSION = 50;
const POINTS_GAP_CLOSED = 30;

// Deterministic PRNG so every reset gives the same data.
let seedState = 42;
function rand(): number {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const ago = (days: number) => new Date(Date.now() - days * DAY);
/** A random moment between the start of this month and now (keeps the monthly leaderboard full). */
function inThisMonth(): Date {
  const now = Date.now();
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return new Date(start + rand() * (now - start - 60_000));
}

function referralCode(name: string, i: number): string {
  return (name.split(" ")[0].normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5) + (100 + i * 7)).slice(0, 8);
}

async function wipe() {
  // Children first.
  await db.pointEvent.deleteMany();
  await db.order.deleteMany();
  await db.promoCode.deleteMany();
  await db.review.deleteMany();
  await db.reply.deleteMany();
  await db.thread.deleteMany();
  await db.booking.deleteMany();
  await db.liveEvent.deleteMany();
  await db.lesson.deleteMany();
  await db.conceptState.deleteMany();
  await db.message.deleteMany();
  await db.teachSession.deleteMany();
  await db.primer.deleteMany();
  await db.concept.deleteMany();
  await db.topic.deleteMany();
  await db.session.deleteMany();
  await db.user.updateMany({ data: { referredById: null } });
  await db.user.deleteMany();
}

async function main() {
  await wipe();
  const now = new Date();

  // ---- Topics + concepts
  const topicRows: (Topic & { concepts: Concept[] })[] = [];
  for (const t of topics) {
    const row = await db.topic.create({
      data: {
        slug: t.slug,
        title: t.title,
        subject: t.subject,
        difficulty: t.difficulty,
        summary: t.summary,
        intro: t.intro,
        concepts: { create: t.concepts.map(([name, description], order) => ({ name, description, order })) },
      },
      include: { concepts: true },
    });
    topicRows.push(row);
  }
  const bySlug = new Map(topicRows.map((t) => [t.slug, t]));

  // ---- Users
  const seedHash = await bcrypt.hash("teachback-seed-2026", 10);
  const demoHash = await bcrypt.hash("demo1234", 10);
  const demo = await db.user.create({
    data: {
      name: "Jordan Ellis",
      email: "demo@teachback.app",
      passwordHash: demoHash,
      plan: "trial",
      trialEndsAt: new Date(now.getTime() + 5 * DAY),
      streak: 4,
      lastActiveAt: ago(1),
      referralCode: "JORDAN26",
      createdAt: ago(2),
    },
  });
  const users: User[] = [];
  for (let i = 0; i < people.length; i++) {
    const [name, local] = people[i];
    const plan = i % 5 === 0 ? "pro" : i % 7 === 0 ? "team" : i % 3 === 0 ? "free" : "trial";
    users.push(
      await db.user.create({
        data: {
          name,
          email: `${local}@${emailDomains[i % emailDomains.length]}`,
          passwordHash: seedHash,
          plan,
          trialEndsAt: plan === "trial" ? new Date(now.getTime() + (1 + (i % 6)) * DAY) : null,
          streak: Math.floor(rand() * 28),
          lastActiveAt: ago(rand() * 3),
          referralCode: referralCode(name, i),
          createdAt: ago(20 + i * 2),
        },
      }),
    );
  }
  // A few referrals so the referral page has data for Amara (users[0]).
  for (const u of [users[8], users[16], users[22]]) {
    await db.user.update({ where: { id: u.id }, data: { referredById: users[0].id, referralClaimed: true } });
  }
  // The demo account has one friend whose free week is still waiting to be claimed.
  await db.user.update({ where: { id: users[11].id }, data: { referredById: demo.id } });
  await db.user.update({ where: { id: users[0].id }, data: { bonusDays: 21 } });

  // ---- Finished teach sessions + concept states (others + demo user)
  const states = ["understood", "understood", "understood", "shaky", "gap"] as const;
  async function finishedSession(userId: string, slug: string, daysAgo: number) {
    const topic = bySlug.get(slug)!;
    const results = topic.concepts.map((c) => ({ c, state: pick([...states]) }));
    const score = results.filter((r) => r.state === "understood").length;
    const s = await db.teachSession.create({
      data: {
        userId,
        topicId: topic.id,
        status: "finished",
        score,
        pipSummary: `I think I get most of ${topic.title} now, but I'm still fuzzy on ${results.find((r) => r.state !== "understood")?.c.name ?? "a couple of details"}.`,
        startedAt: ago(daysAgo),
        finishedAt: new Date(ago(daysAgo).getTime() + 12 * 60_000),
        messages: {
          create: [
            { role: "pip", content: `Hi! I'm Pip. I've heard about ${topic.title} but honestly I have no idea what it is. Can you explain it to me?` },
            { role: "teacher", content: topic.concepts[0].description },
            { role: "pip", content: "Ohh, okay! And what happens after that?" },
          ],
        },
      },
    });
    for (const { c, state } of results) {
      await db.conceptState.upsert({
        where: { userId_conceptId: { userId, conceptId: c.id } },
        create: {
          userId,
          conceptId: c.id,
          teachSessionId: s.id,
          state,
          evidence: state === "gap" ? "" : c.description.split(",")[0],
          feedback: state === "understood" ? "Clear and in your own words." : state === "shaky" ? "Right idea, but the key step was vague." : "Not covered yet.",
        },
        update: {},
      });
    }
    await db.pointEvent.create({ data: { userId, amount: POINTS_SESSION, reason: "session_finished", createdAt: inThisMonth() } });
    return POINTS_SESSION;
  }

  const slugs = topics.map((t) => t.slug).filter((s) => s !== "photosynthesis");
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const n = 1 + Math.floor(rand() * 5);
    let pts = 0;
    for (let k = 0; k < n; k++) pts += await finishedSession(u.id, pick(slugs), rand() * 25);
    const gaps = Math.floor(rand() * 6);
    for (let g = 0; g < gaps; g++) {
      await db.pointEvent.create({ data: { userId: u.id, amount: POINTS_GAP_CLOSED, reason: "gap_closed", createdAt: inThisMonth() } });
      pts += POINTS_GAP_CLOSED;
    }
    await db.user.update({ where: { id: u.id }, data: { points: pts + Math.floor(rand() * 400) } });
  }
  // Demo user: three topics done, Photosynthesis left fresh for the stage demo.
  let demoPts = 0;
  for (const [slug, d] of [["water-cycle", 3], ["supply-and-demand", 2], ["recursion", 1]] as const) demoPts += await finishedSession(demo.id, slug, d);
  await db.pointEvent.create({ data: { userId: demo.id, amount: POINTS_GAP_CLOSED, reason: "gap_closed", createdAt: inThisMonth() } });
  await db.user.update({ where: { id: demo.id }, data: { points: demoPts + POINTS_GAP_CLOSED } });
  // One earlier lesson so "Your lessons" on the dashboard isn't empty (written after the states, so it counts as current).
  const weakState = await db.conceptState.findFirst({
    where: { userId: demo.id, state: { in: ["gap", "shaky"] } },
    include: { concept: { include: { topic: { include: { concepts: { orderBy: { order: "asc" } } } } } } },
    orderBy: { updatedAt: "asc" },
  });
  if (weakState) {
    const t = weakState.concept.topic;
    const content = demoLesson({ slug: t.slug, title: t.title, concepts: t.concepts }, weakState.concept.name, weakState.feedback);
    await db.lesson.create({ data: { conceptStateId: weakState.id, conceptId: weakState.conceptId, userId: demo.id, content: JSON.stringify(content) } });
  }

  // ---- Live events + bookings
  // `npm run demo:reset` sets DEMO_OPENS_IN_MIN=3 so booking opens on stage; a plain seed uses 5.
  const opensIn = Number(process.env.DEMO_OPENS_IN_MIN) || 5;
  for (const e of liveEvents(now, opensIn)) {
    const { prebooked, topic, ...data } = e;
    const ev = await db.liveEvent.create({ data: { ...data, topicId: bySlug.get(topic)?.id } });
    const bookers = users.slice(0, Math.min(prebooked, users.length));
    for (const u of bookers) await db.booking.create({ data: { eventId: ev.id, userId: u.id, createdAt: ago(rand()) } });
    // Seats beyond the 25 real users are filled by extra seeded learners.
    for (let k = bookers.length; k < prebooked; k++) {
      const extra = await db.user.upsert({
        where: { email: `learner${k}@teachback.app` },
        update: {},
        create: { name: pick(people)[0].split(" ")[0] + " " + "ABCDEFGHJKLMNPRSTVW"[k % 19] + ".", email: `learner${k}@teachback.app`, passwordHash: seedHash, plan: "free", referralCode: `LRN${k}X${Math.floor(rand() * 900 + 100)}` },
      });
      await db.booking.create({ data: { eventId: ev.id, userId: extra.id } });
    }
  }

  // ---- Forum
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i];
    await db.thread.create({
      data: {
        title: t.title,
        body: t.body,
        topicId: t.topic ? bySlug.get(t.topic)?.id : null,
        userId: users[(i * 3) % users.length].id,
        createdAt: ago(1 + i * 1.3),
        replies: { create: t.replies.map((body, r) => ({ body, userId: users[(i * 3 + r + 1) % users.length].id, createdAt: ago(1 + i * 1.3 - (r + 1) * 0.1) })) },
      },
    });
  }

  // ---- Reviews: 30, spread over topics, one per user per topic
  for (let i = 0; i < 30; i++) {
    const topic = topicRows[i % topicRows.length];
    const [stars, text] = reviewTexts[(i * 7) % reviewTexts.length];
    await db.review.create({ data: { topicId: topic.id, userId: users[(i * 5) % users.length].id, stars, text, createdAt: ago(1 + i * 0.7) } });
  }
  for (const t of topicRows) {
    const agg = await db.review.aggregate({ where: { topicId: t.id }, _avg: { stars: true }, _count: true });
    await db.topic.update({ where: { id: t.id }, data: { rating: Math.round((agg._avg.stars ?? 0) * 10) / 10, ratingCount: agg._count } });
  }

  // ---- Promo codes
  await db.promoCode.createMany({
    data: [
      { code: "WELCOME20", description: "20% off your first month", percentOff: 20, maxUses: 1000, expiresAt: new Date(now.getTime() + 60 * DAY) },
      { code: "STUDENT50", description: "50% off for students", percentOff: 50, maxUses: 200, uses: 37, expiresAt: new Date(now.getTime() + 120 * DAY) },
      { code: "HACKATHON", description: "Hackathon week: first month free", percentOff: 100, maxUses: 50, uses: 12, expiresAt: new Date(now.getTime() + 7 * DAY) },
    ],
  });

  const counts = await Promise.all([db.topic.count(), db.concept.count(), db.user.count(), db.teachSession.count(), db.liveEvent.count(), db.thread.count(), db.review.count(), db.promoCode.count()]);
  console.log("Seeded topics=%d concepts=%d users=%d sessions=%d events=%d threads=%d reviews=%d promos=%d", ...counts);
  console.log("Demo event booking opens at %s (in %d min). Demo login: demo@teachback.app / demo1234", new Date(now.getTime() + opensIn * 60_000).toLocaleTimeString(), opensIn);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
