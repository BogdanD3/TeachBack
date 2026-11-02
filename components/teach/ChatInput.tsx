"use client";

import { Loader2, Mic, SendHorizontal, Square } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { MAX_RECORDING_SEC, useVoiceInput } from "./useVoiceInput";

type Props = {
  sessionId: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
};

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function ChatInput({ sessionId, value, onChange, onSend, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  // The transcript is appended to whatever is already typed, then focused so the user can check it.
  const onText = useCallback(
    (text: string) => {
      const base = valueRef.current.trim();
      onChange(base ? `${base} ${text}` : text);
      ref.current?.focus();
    },
    [onChange],
  );
  const mic = useVoiceInput(sessionId, onText);
  const recording = mic.state === "recording";
  const transcribing = mic.state === "transcribing";

  // Auto-grow with the text (typed, dictated or cleared after sending), max 160px.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {mic.error && (
        <p role="alert" className="mb-2 text-sm font-medium text-ink">
          {mic.error}
        </p>
      )}
      {(recording || transcribing) && (
        <p role="status" className="t-meta mb-2 text-ink-2" id="voice-status">
          {recording ? `Recording ${clock(mic.seconds)} / ${clock(MAX_RECORDING_SEC)} · tap stop when you're done` : "Turning your voice into text…"}
        </p>
      )}
      <form
        id="teach-message-form"
        name="teach-message-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (recording) mic.stop();
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
          placeholder={recording ? "Listening…" : transcribing ? "Transcribing…" : "Explain it to Pip…"}
          maxLength={2000}
          className="min-h-12 flex-1 resize-none rounded-[24px] border-[1.5px] border-line bg-white px-4 py-3 text-base leading-6 focus:border-coral focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
        {mic.supported && (
          <button
            type="button"
            onClick={() => (recording ? mic.stop() : mic.start())}
            disabled={transcribing}
            aria-pressed={recording}
            aria-label={recording ? "Stop recording" : transcribing ? "Transcribing your recording" : "Speak instead of typing"}
            aria-describedby={recording || transcribing ? "voice-status" : undefined}
            data-action="voice_input"
            className={`grid size-12 shrink-0 place-items-center rounded-full transition-colors duration-150 disabled:opacity-60 ${
              recording ? "pulse-ring bg-coral text-white" : "border-[1.5px] border-line bg-white text-ink hover:border-ink"
            }`}
          >
            {recording ? (
              <Square className="size-4 fill-current" aria-hidden />
            ) : transcribing ? (
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <Mic className="size-5" aria-hidden />
            )}
          </button>
        )}
        <button
          type="submit"
          disabled={disabled || !value.trim() || transcribing}
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
