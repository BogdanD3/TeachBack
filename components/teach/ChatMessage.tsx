import { Pip, type PipState } from "./Pip";

export type ChatMsg = { id: string; role: "teacher" | "pip"; content: string; confused?: boolean };

export function ChatMessage({ msg, pipState, streaming }: { msg: ChatMsg; pipState?: PipState; streaming?: boolean }) {
  if (msg.role === "teacher") {
    return (
      <li className="flex justify-end">
        <p className="sr-only">You said:</p>
        <div className="max-w-[85%] whitespace-pre-wrap rounded-bubble rounded-br-md bg-ink px-4 py-3 text-paper md:max-w-[75%]">{msg.content}</div>
      </li>
    );
  }
  return (
    <li className="flex items-end gap-2">
      <span className="shrink-0">
        <Pip state={pipState ?? (msg.confused ? "confused" : "idle")} size={36} decorative animated={Boolean(pipState)} />
      </span>
      <div className="relative max-w-[85%] rounded-bubble rounded-bl-md border border-line bg-white px-4 py-3 md:max-w-[75%]">
        <p className="sr-only">Pip said:</p>
        {msg.confused && (
          <span className="absolute -top-2.5 right-3 rounded-full bg-highlight px-2 font-mono text-xs font-bold leading-5 text-ink" aria-label="Pip is confused">
            ?
          </span>
        )}
        <p className="whitespace-pre-wrap" data-streaming={streaming || undefined}>
          {msg.content}
          {streaming && <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-coral motion-reduce:animate-none" aria-hidden />}
        </p>
      </div>
    </li>
  );
}
