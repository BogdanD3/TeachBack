"use client";

// POST that reads an NDJSON stream (one JSON object per line). Non-2xx responses are plain JSON
// errors and go through the same handling as postJson (incl. the BotLens modals).
import { failure, OFFLINE, type ApiResult } from "./post-json";

export async function postStream<E>(url: string, body: unknown, onEvent: (event: E) => void, opts?: { onRetry?: () => void }): Promise<ApiResult<null>> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return OFFLINE;
  }
  if (!res.ok || !res.body) {
    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      /* empty body */
    }
    return failure(res.status, data, opts?.onRetry);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (value) buffer += value;
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (line) onEvent(JSON.parse(line) as E);
      }
      if (done) break;
    }
    if (buffer.trim()) onEvent(JSON.parse(buffer) as E);
  } catch {
    return { ok: false, status: res.status, error: "stream", message: "The connection dropped while Pip was answering. Reload to see the reply." };
  }
  return { ok: true, status: res.status, data: null };
}
