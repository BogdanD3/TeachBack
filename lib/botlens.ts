// BotLens integration point. The BotLens team replaces the body of checkRequest().
// See BOTLENS.md for every action, route and request shape.
import { clientIp } from "./client-ip";

export const BOTLENS_ACTIONS = [
  "login",
  "signup",
  "book_seat",
  "apply_promo",
  "checkout",
  "post_forum",
  "post_review",
  "referral_claim",
  "leaderboard_submit",
  "ai_message",
] as const;

export type BotLensAction = (typeof BOTLENS_ACTIONS)[number];

export type BotLensResult = {
  /** false → route answers HTTP 403 { error: "blocked" } */
  allow: boolean;
  /** true → route answers HTTP 429 { error: "challenge" } and the UI shows "Please verify you're human" */
  challenge?: boolean;
  reason?: string;
};

/** What BotLens gets to look at for each request. */
export type BotLensContext = {
  action: BotLensAction;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  headers: Headers;
};

/** Called at the start of every protected route. Currently always allows. */
export async function checkRequest(req: Request, action: BotLensAction): Promise<BotLensResult> {
  const ctx: BotLensContext = {
    action,
    ip: clientIp(req.headers),
    userAgent: req.headers.get("user-agent") ?? "",
    path: new URL(req.url).pathname,
    method: req.method,
    headers: req.headers,
  };
  void ctx; // BotLens: send ctx to your detector here and map the verdict to BotLensResult.

  // Testing hook: BOTLENS_FORCE=block|challenge simulates a verdict for every action.
  const force = process.env.BOTLENS_FORCE;
  if (force === "block") return { allow: false, reason: "forced by BOTLENS_FORCE" };
  if (force === "challenge") return { allow: true, challenge: true, reason: "forced by BOTLENS_FORCE" };

  return { allow: true };
}
