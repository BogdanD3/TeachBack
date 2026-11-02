"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Pip } from "./Pip";

/**
 * Progress screen for slow AI work (gap report, lessons, primers): Pip thinking plus status
 * lines that tick through while the server works. The last line stays until the page arrives.
 */
export function ProgressSteps({ title, steps, intervalMs = 2600 }: { title: string; steps: string[]; intervalMs?: number }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), intervalMs);
    return () => clearInterval(id);
  }, [steps.length, intervalMs]);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center text-center" aria-busy="true">
      <Pip state="thinking" size={110} />
      <p className="t-h3 mt-4">{title}</p>
      <ol className="mt-6 w-full space-y-2 text-left" aria-label="Progress">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex min-h-7 items-center gap-3 transition-opacity duration-300 ${i > step ? "opacity-0" : i < step ? "text-ink-2" : "font-semibold text-ink"}`}
            aria-hidden={i > step}
          >
            {i < step ? (
              <Check className="size-4 shrink-0 text-understood" aria-hidden />
            ) : (
              <span className={`size-2 shrink-0 rounded-full ${i === step ? "animate-pulse bg-coral motion-reduce:animate-none" : "bg-line"} mx-1`} aria-hidden />
            )}
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">
        {steps[step]}
      </p>
    </div>
  );
}
