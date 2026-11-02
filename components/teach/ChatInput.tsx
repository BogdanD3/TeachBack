"use client";

import { Mic, SendHorizontal, Square } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useSpeechInput } from "./useSpeech";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const base = useRef("");
  const onSpeech = useCallback(
    (text: string, final: boolean) => {
      const next = (base.current ? base.current + " " : "") + text.trim();
      onChange(next);
      if (final) base.current = next;
    },
    [onChange],
  );
  const mic = useSpeechInput(onSpeech);

  // Auto-grow with the text (typed, dictated or cleared after sending), max 160px.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  function toggleMic() {
    if (mic.listening) return mic.stop();
    base.current = value.trim();
    mic.start();
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {mic.error && (
        <p role="alert" className="mb-2 text-sm font-medium text-ink">
          {mic.error}
        </p>
      )}
    <form
      id="teach-message-form"
      name="teach-message-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (mic.listening) mic.stop();
        onSend();
      }}
      className="flex w-full items-end gap-2"
    >
      <label htmlFor="teach-message" className="sr-only">
        Explain it to Pip
      </label>
      <textarea
        id="teach-message"
        name="message"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={mic.listening ? "Listening…" : "Explain it in your own words…"}
        maxLength={2000}
        className="min-h-12 flex-1 resize-none rounded-[24px] border-[1.5px] border-line bg-white px-4 py-3 text-base leading-6 focus:border-coral focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
      {mic.supported && (
        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={mic.listening}
          aria-label={mic.listening ? "Stop recording" : "Speak instead of typing"}
          data-action="voice_input"
          className={`grid size-12 shrink-0 place-items-center rounded-full transition-colors duration-150 ${
            mic.listening ? "pulse-ring bg-coral text-white" : "border-[1.5px] border-line bg-white text-ink hover:border-ink"
          }`}
        >
          {mic.listening ? <Square className="size-4 fill-current" aria-hidden /> : <Mic className="size-5" aria-hidden />}
        </button>
      )}
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send to Pip"
        data-action="ai_message"
        className="grid size-12 shrink-0 place-items-center rounded-full bg-coral text-white transition-colors duration-150 hover:bg-coral-dark disabled:opacity-40"
      >
        <SendHorizontal className="size-5" aria-hidden />
      </button>
    </form>
    </div>
  );
}
