import { Highlight } from "@/components/ui/Highlight";

const steps = [
  { n: "01", title: "Explain", body: "Pick a topic you think you know and explain it in your own words. Type it or say it out loud." },
  { n: "02", title: "Pip gets confused", body: "Pip asks the naive “why?” and “how?” a real beginner would. Vague answers don't survive." },
  { n: "03", title: "See your gaps", body: "Your gap report shows what's solid, what's shaky and what's missing, quoting your own words." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-h" className="border-y border-line bg-white">
      <div className="gutter mx-auto max-w-content py-16 md:py-24">
        <h2 id="how-h" className="t-h1 max-w-reading">
          Ten minutes. One <Highlight>honest</Highlight> answer.
        </h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-12">
          {steps.map((s, i) => (
            <li key={s.n} className="relative">
              <p className="font-mono text-sm font-medium text-coral-dark">{s.n}</p>
              <h3 className="t-h3 mt-2">{s.title}</h3>
              <p className="mt-2 text-ink-2">{s.body}</p>
              {i < steps.length - 1 && (
                <svg aria-hidden className="absolute -right-10 top-1 hidden h-6 w-8 md:block" viewBox="0 0 32 24" fill="none">
                  <path d="M2 12h26m-6-6 6 6-6 6" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
