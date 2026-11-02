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

  const forced = forcedVerdict(req, action);
  if (forced === "block") return { allow: false, reason: "forced (test hook)" };
  if (forced === "challenge") return { allow: true, challenge: true, reason: "forced (test hook)" };

  return { allow: true };
}

/**
 * Test hooks (see BOTLENS.md):
 * - BOTLENS_FORCE=block|challenge forces a verdict for every action (any environment).
 * - Outside production, a `botlens_force` cookie like `challenge@signup+login` or `block` forces a
 *   verdict per request, so e2e tests can check each action's UI in one run.
 */
function forcedVerdict(req: Request, action: BotLensAction): "block" | "challenge" | null {
  const env = process.env.BOTLENS_FORCE;
  if (env === "block" || env === "challenge") return env;
  if (process.env.NODE_ENV === "production") return null;
  const raw = req.headers.get("cookie")?.match(/(?:^|;\s*)botlens_force=([^;]+)/)?.[1];
  if (!raw) return null;
  const [verdict, actions] = decodeURIComponent(raw).split("@");
  if (verdict !== "block" && verdict !== "challenge") return null;
  if (actions && !actions.split("+").includes(action)) return null;
  return verdict;
}
