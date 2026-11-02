import { ScoreRing } from "@/components/report/ScoreRing";
import { Pill } from "@/components/ui/Pill";

const rows = [
  { name: "Calvin cycle", state: "gap", quote: "", feedback: "You didn't explain how CO₂ is turned into sugar." },
  { name: "Where the oxygen comes from", state: "shaky", quote: "The plant breathes out oxygen as waste.", feedback: "Right idea, but it comes from splitting water." },
  { name: "Light-dependent reactions", state: "understood", quote: "Light energy splits water and makes ATP.", feedback: "Clear, and in your own words." },
] as const;

/** A static rendering of the real gap report, used as the landing-page "screenshot". */
export function ReportPreview() {
  return (
    <section id="demo" aria-labelledby="demo-h" className="gutter mx-auto max-w-content scroll-mt-20 py-16 md:py-24">
      <div className="grid gap-12 md:grid-cols-[1fr_1.3fr] md:items-center">
        <div>
          <p className="t-meta text-ink-2">The gap report</p>
          <h2 id="demo-h" className="t-h1 mt-2">See exactly where you got lost</h2>
          <p className="mt-4 text-ink-2">
            After each session, every concept is marked understood, shaky or gap, with a quote from what you said. One tap opens a
            short lesson for the exact gap. Then you teach Pip again.
          </p>
        </div>
        {/* DEMO VIDEO SLOT: swap this preview for <video src="/demo.mp4" controls poster="…" /> when the recording is ready. */}
        <figure className="rounded-card border border-line bg-paper-2 p-2 md:p-3">
          <div className="flex items-center gap-1.5 px-2 pb-2" aria-hidden>
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="ml-3 font-mono text-xs text-ink-2">teachback.app/report</span>
          </div>
          <div className="rounded-[10px] border border-line bg-paper p-4 md:p-6">
            <p className="t-meta text-ink-2">Gap report · Photosynthesis</p>
            <div className="mt-3">
              <ScoreRing score={5} total={7} size={96} />
            </div>
            <ul className="mt-4 space-y-3">
              {rows.map((r) => (
                <li key={r.name} className="rounded-card border border-line bg-white p-3 md:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{r.name}</p>
                    <Pill state={r.state} />
                  </div>
                  {r.quote && <p className="mt-2 border-l-[3px] border-coral pl-3 text-sm italic">“{r.quote}”</p>}
                  <p className="mt-2 text-sm text-ink-2">{r.feedback}</p>
                </li>
              ))}
            </ul>
          </div>
          <figcaption className="sr-only">Example gap report for Photosynthesis: 5 of 7 concepts solid.</figcaption>
        </figure>
      </div>
    </section>
  );
}
