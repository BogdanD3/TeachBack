"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { failure, OFFLINE, type ApiResult } from "@/lib/client/post-json";

export const MAX_RECORDING_SEC = 60;
// First type the browser can record wins: Chrome/Firefox → webm/ogg (Opus), Safari → mp4 (AAC).
const TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4", "audio/aac"];

export type VoiceState = "idle" | "recording" | "transcribing";

function isSupported(): boolean {
  return typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

async function upload(sessionId: string, blob: Blob, onRetry: () => void): Promise<ApiResult<{ text: string }>> {
  const form = new FormData();
  form.append("sessionId", sessionId);
  form.append("audio", new File([blob], "recording", { type: blob.type || "audio/webm" }));
  let res: Response;
  try {
    res = await fetch("/api/transcribe", { method: "POST", body: form });
  } catch {
    return OFFLINE;
  }
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return res.ok ? { ok: true, status: res.status, data: data as { text: string } } : failure(res.status, data, onRetry);
}

/**
 * Mic input for every browser with MediaRecorder + getUserMedia: record (max 60 s), send the audio
 * to /api/transcribe (Gemini), hand the text back for the user to check before sending.
 */
export function useVoiceInput(sessionId: string, onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cb = useRef(onText);
  useEffect(() => {
    cb.current = onText;
  }, [onText]);

  useEffect(() => {
    // Feature detection has to run on the client after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(isSupported());
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (rec.current?.state === "recording") rec.current.stop();
    };
  }, []);

  const retry = useRef<(blob: Blob) => void>(() => {});
  const transcribe = useCallback(
    async (blob: Blob) => {
      setState("transcribing");
      const res = await upload(sessionId, blob, () => retry.current(blob)); // BotLens "try again" resends the same audio
      setState("idle");
      if (!res.ok) {
        if (res.error !== "challenge" && res.error !== "blocked") setError(res.message);
        return;
      }
      if (!res.data.text.trim()) return setError("Didn't catch any words. Try again a bit closer to the mic.");
      cb.current(res.data.text.trim());
    },
    [sessionId],
  );
  useEffect(() => {
    retry.current = (blob) => void transcribe(blob);
  }, [transcribe]);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (rec.current?.state === "recording") rec.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setError(denied ? "Microphone access was blocked. Allow it in your browser settings." : "No microphone found.");
      return;
    }
    const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    const r = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: r.mimeType || mimeType || "audio/webm" });
      if (blob.size) void transcribe(blob);
      else setState("idle");
    };
    rec.current = r;
    r.start();
    setSeconds(0);
    setState("recording");
    const t0 = Date.now();
    timer.current = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      setSeconds(s);
      if (s >= MAX_RECORDING_SEC) stop();
    }, 250);
  }, [stop, transcribe]);

  return { supported, state, seconds, error, start, stop };
}
