# BOTLENS.md — plugging BotLens into Teachback

Teachback is built to be attacked. This file lists every place BotLens can watch, score and block.

## 1. The two integration points

| Where | What to do |
|---|---|
| `app/layout.tsx` → `<head>` | Commented **BOTLENS TRACKING SCRIPT SLOT**. Add your `<Script src=… strategy="beforeInteractive" />` there (import `Script` from `next/script`). It loads on every page. |
| `lib/botlens.ts` → `checkRequest(req, action)` | Called at the very start of every protected API route. Replace the body with a call to your detector and return a `BotLensResult`. |

```ts
export type BotLensResult = {
  allow: boolean;      // false → route answers 403 { error: "blocked" }
  challenge?: boolean; // true  → route answers 429 { error: "challenge" } and the UI asks "Please verify you're human"
  reason?: string;     // free text, for your logs
};
```

`checkRequest` already builds a `BotLensContext` for you: `action`, `ip` (from `X-Forwarded-For` → `X-Real-IP`, we run behind Nginx), `userAgent`, `path`, `method` and the full `headers`. Your cookies are in `headers.get("cookie")`.

The response mapping lives in `lib/api.ts → botGuard()`. Routes never talk to BotLens directly.

## 2. Protected actions

All are `POST` with a JSON body (`Content-Type: application/json`). Session = HTTP-only cookie `tb_session`.

| Action | Route | Body | Auth | Button / form |
|---|---|---|---|---|
| `signup` | `/api/auth/signup` | `{ name, email, password, ref?, next? }` | no | `#signup-form`, `[data-action="signup"]` |
| `login` | `/api/auth/login` | `{ email, password, next? }` | no | `#login-form`, `[data-action="login"]` |
| `ai_message` | `/api/teach/:sessionId/message` | `{ content }` | yes | `#teach-message-form`, `[data-action="ai_message"]` |
| `ai_message` + `leaderboard_submit` | `/api/teach/:sessionId/finish` | `{}` | yes | `[data-action="finish_session"]` (finishing calls the AI and awards leaderboard points) |
| `book_seat` | `/api/live/:eventId/book` | `{}` | yes | `[data-action="book_seat"][data-event-id]` on `/live` |
| `post_review` | `/api/reviews` | `{ topic, stars, text }` | yes | `#review-form`, `[data-action="post_review"]` |
| `post_forum` | `/api/community/threads` | `{ title, body, topic? }` | yes | `#thread-form`, `[data-action="post_forum"]` |
| `post_forum` | `/api/community/threads/:threadId/replies` | `{ body }` | yes | `#reply-form`, `[data-action="post_forum"]` |
| `apply_promo` | `/api/checkout/promo` | `{ code, plan: "pro"\|"team" }` | no | `#promo-form`, `[data-action="apply_promo"]` |
| `checkout` | `/api/checkout` | `{ plan, promo?, cardName, cardNumber, cardExpiry, cardCvc }` | yes | `#checkout-form`, `[data-action="checkout"]` |
| `referral_claim` | `/api/referral/claim` | `{}` | yes | `[data-action="referral_claim"]` on `/referral` |

Unprotected but interesting to watch: `GET /api/live/seats` (polled every 2 s by `/live` — scalpers will hammer it), `POST /api/auth/logout`.

Form `id`/`name` attributes and `data-action` values are stable. Don't expect random ids.

## 3. What attackers will go for

- **Limited seats:** `/live` has 30-seat events. The demo event opens for booking a few minutes after `npm run demo:reset`.
- **Sign-up farming:** each sign-up gets a 7-day trial; `/signup?ref=CODE` links a referrer, who can then claim a free week per friend (`referral_claim`).
- **Promo code guessing:** real codes are `WELCOME20`, `STUDENT50`, `HACKATHON` (limited uses).
- **Credential stuffing:** `/api/auth/login` (demo account `demo@teachback.app` / `demo1234`).
- **Forum / review spam:** `post_forum`, `post_review`.
- **Leaderboard farming:** finishing sessions awards points (`leaderboard_submit`).
- **AI abuse:** `ai_message` burns our Gemini quota.
- **Scraping:** topic pages (`/library/:slug`) and lessons are server-rendered HTML.
- **Path scanning:** every unknown page or id returns a real **HTTP 404** (`bash scripts/check-404.sh`).

Our own small rate limits (in-memory, per process) sit *after* BotLens: AI routes 10/min per user, login 20/min per IP, promo 15/min per IP, forum 5/min per user. They answer `429 { error: "rate_limited" }` — distinct from your `challenge`.

## 4. Frontend behaviour

All forms post through `lib/client/post-json.ts`. When a route answers `403 blocked` or `429 challenge`, it fires a `botlens:verdict` window event and `components/BotLensGate.tsx` opens:

- `dialog#botlens-blocked` — "This action was blocked".
- `dialog#botlens-challenge` — "Please verify you're human", with an empty **`#botlens-challenge-slot`** where you can mount a challenge widget, and an "I'm human, try again" button (`[data-action="botlens_verify"]`) that retries the original request.

## 5. Testing verdicts

- `BOTLENS_FORCE=block` or `BOTLENS_FORCE=challenge` in the environment forces that verdict for **every** action.
- Outside production, a cookie `botlens_force=<block|challenge>[@action1+action2]` forces a verdict per request, e.g. `botlens_force=challenge@book_seat`. Ignored when `NODE_ENV=production`.
- `bash scripts/e2e.sh botlens.py` checks the modal for every action.

Quick manual check:

```bash
curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -H 'Cookie: botlens_force=block@login' -d '{"email":"a@b.c","password":"x"}'
# → {"error":"blocked","message":"This request was blocked."}  (HTTP 403)
```
