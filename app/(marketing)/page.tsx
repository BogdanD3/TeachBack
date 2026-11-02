import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveTeaser } from "@/components/landing/LiveTeaser";
import { PricingTeaser } from "@/components/landing/PricingTeaser";
import { ReportPreview } from "@/components/landing/ReportPreview";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhyTeaching } from "@/components/landing/WhyTeaching";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: { absolute: "Teachback — Learn it by teaching it" },
  description: "Explain a topic to Pip, a deliberately confused AI student. Teachback finds the exact gaps in your understanding and fixes them.",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  const serverNow = new Date();
  // Prefer the next event whose booking hasn't opened yet (that's the one with a countdown).
  const next =
    (await db.liveEvent.findFirst({ where: { bookingOpensAt: { gt: serverNow } }, orderBy: { bookingOpensAt: "asc" }, include: { _count: { select: { bookings: true } } } })) ??
    (await db.liveEvent.findFirst({ where: { startsAt: { gt: serverNow } }, orderBy: { startsAt: "asc" }, include: { _count: { select: { bookings: true } } } }));

  return (
    <>
      <Hero loggedIn={Boolean(user)} />
      <HowItWorks />
      <ReportPreview />
      <WhyTeaching />
      <LiveTeaser event={next ? { ...next, booked: next._count.bookings } : null} serverNow={serverNow.toISOString()} />
      <PricingTeaser />
      <Testimonials />
    </>
  );
}
