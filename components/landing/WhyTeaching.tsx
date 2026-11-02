import { Pip } from "@/components/teach/Pip";

export function WhyTeaching() {
  return (
    <section aria-labelledby="why-h" className="bg-ink text-paper">
      <div className="gutter mx-auto grid max-w-content gap-8 py-16 md:grid-cols-[auto_1fr] md:items-center md:gap-16 md:py-24">
        <Pip state="got-it" size={120} />
        <div className="max-w-reading">
          <h2 id="why-h" className="t-h1">Why teaching works</h2>
          <p className="mt-4 text-lg text-paper/90">
            Psychologists call it the <strong className="text-highlight">protégé effect</strong>: people who learn something in order to
            teach it understand it more deeply than people who learn it for a test. Explaining forces you to put ideas in order, and the
            steps you always skip suddenly have nowhere to hide.
          </p>
          <p className="mt-4 text-paper/80">The catch has always been finding someone patient enough to listen. Pip is that someone.</p>
        </div>
      </div>
    </section>
  );
}
