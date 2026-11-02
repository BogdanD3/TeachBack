// Small helpers shared by API routes.
import type { z } from "zod";
import { checkRequest, type BotLensAction } from "./botlens";

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(data, { status, headers });
}

export const apiError = (status: number, error: string, message?: string, extra?: Record<string, unknown>) =>
  json({ error, ...(message ? { message } : {}), ...extra }, status);

/** BotLens gate. Returns a Response to send back, or null to continue. */
export async function botGuard(req: Request, action: BotLensAction): Promise<Response | null> {
  const verdict = await checkRequest(req, action);
  if (!verdict.allow) return apiError(403, "blocked", "This request was blocked.");
  if (verdict.challenge) return apiError(429, "challenge", "Please verify you're human.");
  return null;
}

/** Parse a JSON body with a zod schema. */
export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { data: null, error: apiError(400, "invalid_json", "The request body must be JSON.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    return { data: null, error: apiError(400, "invalid_input", "Some fields need another look.", { fields }) };
  }
  return { data: parsed.data, error: null };
}
