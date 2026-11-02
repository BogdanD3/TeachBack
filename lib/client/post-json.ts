"use client";

// Client-side fetch wrapper. Handles the BotLens verdicts globally:
// 403 { error: "blocked" } and 429 { error: "challenge" } dispatch a window event
// that <BotLensGate /> turns into the right modal.

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; message: string; fields?: Record<string, string> };

export const BOTLENS_EVENT = "botlens:verdict";
export type BotLensVerdictDetail = { kind: "blocked" | "challenge"; retry?: () => void };

export async function postJson<T = unknown>(url: string, body: unknown, opts?: { method?: string; onRetry?: () => void }): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts?.method ?? "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return OFFLINE;
  }
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (res.ok) return { ok: true, status: res.status, data: data as T };
  return failure(res.status, data, opts?.onRetry);
}

export const OFFLINE: ApiResult<never> = { ok: false, status: 0, error: "network", message: "You seem to be offline. Check your connection and try again." };

/** Turn an error response body into an ApiResult, firing the BotLens modal for blocked/challenge. */
export function failure(status: number, data: Record<string, unknown>, onRetry?: () => void): ApiResult<never> {
  const error = typeof data.error === "string" ? data.error : "error";
  if (error === "blocked" || error === "challenge") {
    window.dispatchEvent(new CustomEvent<BotLensVerdictDetail>(BOTLENS_EVENT, { detail: { kind: error, retry: onRetry } }));
  }
  const fallback =
    error === "blocked"
      ? "This action was blocked."
      : error === "challenge"
        ? "Please verify you're human to continue."
        : status === 401
          ? "Please log in first."
          : "Something went wrong. Try again.";
  return {
    ok: false,
    status,
    error,
    message: typeof data.message === "string" ? data.message : fallback,
    fields: (data.fields as Record<string, string> | undefined) ?? undefined,
  };
}
