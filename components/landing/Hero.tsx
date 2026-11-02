import { Pip } from "@/components/teach/Pip";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Highlight } from "@/components/ui/Highlight";

const chat = [
  { role: "teacher", text: "Plants make their food from sunlight, using chlorophyll." },
  { role: "pip", text: "Wait, so plants eat light? Then where does the actual food come from?" },
  { role: "teacher", text: "Not quite! Light is the energy. The sugar is built from CO₂ in the air." },
] as const;

export function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="gutter mx-auto grid max-w-content items-center gap-12 pb-16 pt-12 md:grid-cols-[1.1fr_1fr] md:pb-24 md:pt-20">
      <div>
        <h1 className="t-display">
          Learn it by <Highlight>teaching</Highlight> it.
        </h1>
        <p className="mt-6 max-w-[34ch] text-lg text-ink-2 md:text-xl">
          Explain it to Pip. Find out what you really understand.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={loggedIn ? "/library" : "/auth/signup"} size="lg" data-action="hero_start">
            Start teaching — free
          </ButtonLink>
          <ButtonLink href="#demo" size="lg" variant="secondary" data-action="hero_demo">
            Watch demo
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm text-ink-2">7-day free trial. No card needed.</p>
      </div>

      <div className="relative rounded-card border border-line bg-paper-2 p-4 md:p-6" aria-label="Example conversation with Pip">
        <div className="mb-4 flex items-center gap-3">
          <Pip state="confused" size={72} />
          <div>
            <p className="font-semibold">Pip</p>
            <p className="text-sm text-ink-2">Your confused student</p>
          </div>
        </div>
        <ul className="space-y-3">
          {chat.map((m) =>
            m.role === "teacher" ? (
              <li key={m.text} className="ml-auto max-w-[85%] rounded-bubble rounded-br-md bg-ink px-4 py-3 text-paper">
                <span className="sr-only">You: </span>
                {m.text}
              </li>
            ) : (
              <li key={m.text} className="relative max-w-[85%] rounded-bubble rounded-bl-md border border-line bg-white px-4 py-3">
                <span className="sr-only">Pip: </span>
                <span aria-hidden className="absolute -top-2.5 right-3 rounded-full bg-highlight px-2 font-mono text-xs font-bold leading-5">?</span>
                {m.text}
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
