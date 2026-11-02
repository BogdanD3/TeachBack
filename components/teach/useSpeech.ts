"use client";

import { useCallback, useEffect, useState } from "react";

// Speech-to-text lives in useVoiceInput.ts (MediaRecorder + Gemini, works in every browser).

/** Pip's voice via speechSynthesis. */
export function useSpeechOutput() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 1.3;
    window.speechSynthesis.speak(u);
  }, []);
  const cancel = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);
  return { supported, speak, cancel };
}
