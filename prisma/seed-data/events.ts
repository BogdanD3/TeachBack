const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** The demo event opens for booking a few minutes after seeding (see demo:reset). */
export const DEMO_EVENT_SLUG = "photosynthesis-live-explain-off";

export function liveEvents(now: Date, demoOpensInMin = 5) {
  const t = now.getTime();
  return [
    {
      slug: DEMO_EVENT_SLUG,
      title: "Explain-off: Photosynthesis in 5 minutes",
      type: "challenge",
      host: "Dr. Ingrid Halvorsen",
      hostRole: "Plant biologist, University of Bergen",
      description:
        "Thirty learners, one topic, five minutes each with Pip. The clearest explanation of the Calvin cycle wins a year of Pro.",
      topic: "photosynthesis",
      startsAt: new Date(t + demoOpensInMin * MIN + 2 * HOUR),
      bookingOpensAt: new Date(t + demoOpensInMin * MIN),
      durationMin: 45,
      seatsTotal: 30,
      prize: "1 year of Teachback Pro",
      prebooked: 18,
    },
    {
      slug: "newtons-third-law-weekly",
      title: "Weekly challenge: Newton's third law",
      type: "challenge",
      host: "Rafael Costa",
      hostRole: "Physics teacher, Lisbon",
      description: "Why don't action and reaction cancel out? Explain it to Pip in front of a live audience and get scored.",
      topic: "newtons-laws",
      startsAt: new Date(t + 2 * DAY),
      bookingOpensAt: new Date(t - 6 * HOUR),
      durationMin: 40,
      seatsTotal: 30,
      prize: "Leaderboard double points",
      prebooked: 23,
    },
    {
      slug: "how-the-internet-works-live",
      title: "Live session: How the Internet works",
      type: "session",
      host: "Yuki Tanaka",
      hostRole: "Network engineer",
      description: "A guided group session. We walk from typing a URL to the page appearing, and Pip asks the awkward questions.",
      topic: "how-the-internet-works",
      startsAt: new Date(t + 4 * DAY),
      bookingOpensAt: new Date(t + 1 * DAY),
      durationMin: 60,
      seatsTotal: 30,
      prize: null,
      prebooked: 0,
    },
    {
      slug: "compound-interest-sold-out",
      title: "Live session: Compound interest for students",
      type: "session",
      host: "Charlotte Evans",
      hostRole: "Financial educator",
      description: "Rule of 72, credit card debt and why starting at 20 beats starting at 30.",
      topic: "compound-interest",
      startsAt: new Date(t + 1 * DAY + 3 * HOUR),
      bookingOpensAt: new Date(t - 2 * DAY),
      durationMin: 45,
      seatsTotal: 30,
      prize: null,
      prebooked: 30,
    },
  ];
}
