"use client";

import { useId, useRef } from "react";

type Tab = { value: string; label: string };

type Props = {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
};

/** Pill-style tab list with arrow-key navigation. Panels are rendered by the parent. */
export function Tabs({ tabs, value, onChange, label, className }: Props) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: React.KeyboardEvent, i: number) {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next].value);
  }

  return (
    <div role="tablist" aria-label={label} className={["flex gap-1 overflow-x-auto pb-1", className].filter(Boolean).join(" ")}>
      {tabs.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-${t.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={[
              "h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-150",
              active ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
