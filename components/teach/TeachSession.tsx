"use client";

import { Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { postJson } from "@/lib/client/post-json";
import { postStream } from "@/lib/client/post-stream";
import { ChatInput } from "./ChatInput";
import { ProgressSteps } from "./ProgressSteps";
import { ChatMessage, type ChatMsg } from "./ChatMessage";
import { ConceptProgress } from "./ConceptProgress";
import { PeekBar } from "./PeekBar";
import { Pip, type PipState } from "./Pip";
import { useSpeechOutput } from "./useSpeech";

type Props = {
  sessionId: string;
  topic: { slug: string; title: string; concepts: string[] };
  initialMessages: ChatMsg[];
  initialCovered: string[];
  initialPeeks: string[];
};

type Done = { type: "done"; id: string; reply: string; covered: string[]; confused: boolean };
type StreamEvent = { type: "delta"; text: string } | Done | { type: "error"; message: string };
const VOICE_KEY = "tb_pip_voice";
const REPORT_STEPS = ["Reading your explanation…", "Checking each concept…", "Finding quotes from what you said…", "Asking Pip what still confuses them…", "Writing your gap report…"];

export function TeachSession({ sessionId, topic, initialMessages, initialCovered, initialPeeks }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [covered, setCovered] = useState(initialCovered);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [gotIt, setGotIt] = useState(false);
  const [error, setError] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const voice = useSpeechOutput();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Restore the per-browser preference after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVoiceOn(localStorage.getItem(VOICE_KEY) === "1");
    } catch {
      /* storage blocked */
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, streamText]);

  const lastPip = [...messages].reverse().find((m) => m.role === "pip");
  const pipState: PipState = sending ? (streamText ? "idle" : "thinking") : gotIt ? "got-it" : lastPip?.confused ? "confused" : "idle";
  const hasTaught = messages.some((m) => m.role === "teacher");

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) voice.cancel();
    try {
      localStorage.setItem(VOICE_KEY, next ? "1" : "0");
    } catch {
      /* storage blocked */
    }
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "teacher", content }]);
    setInput("");
    setError("");
    setSending(true); // Pip's thinking bubble shows right away, until the first words stream in
    setStreamText("");
    setGotIt(false);
    let done: Done | null = null;
    let streamError = "";
    const res = await postStream<StreamEvent>(
      `/api/teach/${sessionId}/message`,
      { content },
      (ev) => {
        if (ev.type === "delta") setStreamText((s) => s + ev.text);
        else if (ev.type === "done") done = ev;
        else streamError = ev.message;
      },
      { onRetry: () => send(content) },
    );
    setSending(false);
    setStreamText("");
    if (!res.ok && res.status !== 200) {
      // Nothing was saved: take the bubble back and give the text back.
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setInput(content);
      if (res.error !== "challenge" && res.error !== "blocked") setError(res.message);
      return;
    }
    const d = done as Done | null;
    if (!d) {
      setError(streamError || (res.ok ? "Pip didn't finish answering. Reload the page to see the reply." : res.message));
      return;
    }
    const newlyCovered = d.covered.some((c) => !covered.includes(c));
    setCovered(d.covered);
    setGotIt(newlyCovered);
    setMessages((m) => [...m, { id: d.id, role: "pip", content: d.reply, confused: d.confused }]);
    if (voiceOn) voice.speak(d.reply);
  }

  async function finish() {
    setFinishing(true);
    setError("");
    voice.cancel();
    const res = await postJson<{ redirect: string }>(`/api/teach/${sessionId}/finish`, {}, { onRetry: finish });
    if (res.ok) {
      router.push(res.data.redirect);
      return;
    }
    setFinishing(false);
    if (res.error !== "challenge" && res.error !== "blocked") setError(res.message);
  }

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-content items-center gap-2 px-4 md:gap-4 md:px-8">
          <Link href={`/library/${topic.slug}`} aria-label="Leave session" className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-paper-2 hover:text-ink">
            <X className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="t-meta hidden text-ink-2 md:block">Teaching Pip</p>
            <h1 className="truncate font-semibold md:text-lg">{topic.title}</h1>
          </div>
          <div className="hidden md:block">
            <ConceptProgress concepts={topic.concepts} covered={covered} />
          </div>
          {voice.supported && (
            <button
              type="button"
              onClick={toggleVoice}
              aria-pressed={voiceOn}
              aria-label={voiceOn ? "Stop reading Pip's replies aloud" : "Read Pip's replies aloud"}
              className="grid size-11 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-paper-2 hover:text-ink aria-pressed:text-coral-dark"
            >
              {voiceOn ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
            </button>
          )}
          <Button variant="dark" size="sm" onClick={finish} loading={finishing} disabled={!hasTaught || sending} data-action="finish_session">
            <span>
              Finish<span className="hidden sm:inline"> session</span>
            </span>
          </Button>
        </div>
        <div className="border-t border-line px-4 py-2 md:hidden">
          <ConceptProgress concepts={topic.concepts} covered={covered} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
          <div className="mb-8 hidden flex-col items-center md:flex">
            <Pip state={pipState} size={120} />
          </div>
          {/* aria-busy while streaming: screen readers announce Pip's reply once, when it's complete. */}
          <ul className="space-y-4" aria-live="polite" aria-busy={sending} aria-label="Conversation with Pip">
            {messages.map((m) => (
              <ChatMessage key={m.id} msg={m} pipState={m === lastPip && !sending ? pipState : undefined} />
            ))}
            {sending &&
              (streamText ? (
                <ChatMessage msg={{ id: "streaming", role: "pip", content: streamText }} pipState="idle" streaming />
              ) : (
                <li className="flex items-end gap-2">
                  <Pip state="thinking" size={36} decorative />
                  <span className="rounded-bubble rounded-bl-md border border-line bg-white px-4 py-3 text-ink-2">Pip is thinking…</span>
                </li>
              ))}
          </ul>
          {error && (
            <p role="alert" className="mt-4 rounded-card border border-gap/40 bg-white p-3 text-sm">
              {error}
            </p>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-line bg-paper-2 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <PeekBar sessionId={sessionId} disabled={sending || finishing} initialPeeks={initialPeeks} />
        <ChatInput value={input} onChange={setInput} onSend={() => send(input)} disabled={sending || finishing} />
      </div>

      {finishing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-paper/90" role="status">
          <ProgressSteps title="Pip is writing your gap report" steps={REPORT_STEPS} />

        </div>
      )}
    </div>
  );
}
