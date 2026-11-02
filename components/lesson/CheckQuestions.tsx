"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import type { LessonContent } from "@/lib/ai-types";

export function CheckQuestions({ questions }: { questions: LessonContent["questions"] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const done = Object.keys(answers).length;
  const right = questions.filter((q, i) => answers[i] === q.correct_index).length;

  return (
    <section aria-labelledby="check-h" className="mt-12">
      <h2 id="check-h" className="t-h2">
        Check yourself
      </h2>
      <ol className="mt-6 space-y-6">
        {questions.map((q, qi) => {
          const picked = answers[qi];
          const answered = picked !== undefined;
          return (
            <li key={qi} className="rounded-card border border-line bg-white p-4 md:p-6">
              <fieldset>
                <legend className="font-semibold">
                  <span className="t-meta mr-2 text-ink-2">Q{qi + 1}</span>
                  {q.question}
                </legend>
                <div className="mt-4 space-y-2">
                  {q.options.map((opt, oi) => {
                    const isRight = oi === q.correct_index;
                    const state = !answered ? "" : isRight ? "border-understood bg-understood/10" : picked === oi ? "border-gap bg-gap/10" : "opacity-60";
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={answered}
                        onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                        aria-pressed={picked === oi}
                        data-action="lesson_answer"
                        className={`flex min-h-12 w-full items-center gap-3 rounded-card border-[1.5px] border-line px-4 py-2 text-left transition-colors duration-150 enabled:hover:border-ink ${state}`}
                      >
                        <span className="t-meta text-ink-2">{String.fromCharCode(65 + oi)}</span>
                        <span className="flex-1">{opt}</span>
                        {answered && isRight && <CheckCircle2 className="size-5 shrink-0 text-understood" aria-label="Correct answer" />}
                        {answered && !isRight && picked === oi && <XCircle className="size-5 shrink-0 text-gap" aria-label="Your answer, incorrect" />}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <p role="status" className="mt-4 text-sm">
                    <strong>{picked === q.correct_index ? "Right." : "Not quite."}</strong> {q.explanation}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>
      {done === questions.length && (
        <p className="mt-6 font-semibold" role="status">
          {right} of {questions.length} right. {right === questions.length ? "Now explain it to Pip." : "Read the example once more, then try Pip."}
        </p>
      )}
    </section>
  );
}
