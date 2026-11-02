# PLAN.md — Teachback build plan

This is the step-by-step build plan. Work through it **in order**, phase by phase.

- Tick each task (`- [x]`) as soon as it is done, and keep this file updated. It is the memory of the project: if a session ends, the next one continues from the first unticked task.
- A phase is finished only when every "Done when" check passes.
- After each phase: run `npm run lint` and `npm run build`, check the pages with the webapp-testing skill at 375px and 1280px, then commit with the message `phase N: <name>`.
- Record every decision or assumption in the **Decisions log** at the bottom.
- Rules for stack, code and AI are in `CLAUDE.md`. Visual rules are in `DESIGN.md`. AI prompts are in `PROMPTS.md`.

---

## Phase 0 — Project setup

- [x] Set up Next.js (latest, App Router, TypeScript strict, Tailwind, ESLint) **in the current folder**. The folder is not empty (kit files, `.venv`, `.claude`), so `create-next-app .` will refuse: either set it up by hand (`npm init`, install `next react react-dom`, `typescript`, Tailwind + PostCSS, ESLint config, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`), or scaffold into `./_scaffold` and move the files up without overwriting any existing file. Never touch `.env`, `.venv`, `.claude` or the kit `.md` files.
- [x] Install: `@google/genai prisma @prisma/client zod bcryptjs lucide-react framer-motion` (+ dev: `@types/bcryptjs tsx`)
- [x] Create the folder structure from CLAUDE.md
- [x] `.env.example` already exists: keep it in sync if you add variables (never read or edit `.env`)
- [x] Check `.gitignore` covers `.env`, `.venv/`, `*.db`, `node_modules`, `.next`, `.claude/settings.local.json`
- [x] Add npm scripts: `db:migrate`, `db:seed`, `db:reset`, `demo:reset` (placeholder until phase 9)
- [x] If `.env` is missing, stop and tell the user to create it from `.env.example`

**Done when:** `npm run dev` shows the default page, `npm run build` passes.

---

## Phase 1 — Design system

- [x] Color tokens from DESIGN.md as CSS variables in `globals.css`, mapped in Tailwind
- [x] Fonts with `next/font`: Fraunces, Inter, JetBrains Mono
- [x] Spacing, radius and "paper stack" hover shadow as Tailwind utilities
- [x] `components/ui`: Button (primary, secondary, ghost; sizes; loading state), Card, Input + Label + error text, Textarea, Pill (understood, shaky, gap with icons), Badge, Modal, Tabs, Avatar (initials), Highlight (marker effect), Skeleton, EmptyState, ErrorState
- [x] Logo component (SVG wordmark + speech bubble)
- [x] `components/teach/Pip.tsx`: SVG with states `idle`, `thinking`, `confused`, `got-it`, animated with framer-motion, respects reduced motion
- [x] Site header (logo, nav: Library, Live, Leaderboard, Community, Pricing; login/sign-up or avatar menu) and footer; mobile menu
- [x] `/styleguide` page showing every token, font, component and Pip state

**Done when:** `/styleguide` looks right at 375px and 1280px, all focus states visible.

---

## Phase 2 — Database and seed data

- [x] Prisma schema with SQLite. Models (at least):
  - `User` (name, email, passwordHash, plan, trialEndsAt, points, streak, referralCode, referredById, createdAt)
  - `Session` (auth sessions: token, userId, expiresAt)
  - `Topic` (slug, title, subject, difficulty, summary, rating)
  - `Concept` (topicId, name, order)
  - `TeachSession` (userId, topicId, status, score, pipSummary, startedAt, finishedAt)
  - `Message` (teachSessionId, role `teacher`/`pip`, content, createdAt)
  - `ConceptState` (userId, conceptId, state, evidence, feedback, updatedAt)
  - `Lesson` (conceptId, userId, json content)
  - `LiveEvent` (title, type `session`/`challenge`, host, startsAt, bookingOpensAt, seatsTotal)
  - `Booking` (eventId, userId, createdAt; unique per user and event)
  - `Thread`, `Reply` (forum), `Review` (topicId, userId, stars, text)
  - `PromoCode` (code, percentOff, maxUses, uses, expiresAt)
  - `Order` (userId, plan, amount, promoCodeId, status)
- [x] Seed script with realistic data: 12 topics from PROMPTS.md, each with 5–8 concepts; 25 users with real-sounding names; finished sessions and concept states for leaderboard/map; 4 live events (one with booking opening ~5 minutes after seeding, for the demo); 10 forum threads with replies; 30 reviews; 3 promo codes (`WELCOME20`, `STUDENT50`, `HACKATHON`)
- [x] Demo account: `demo@teachback.app` / `demo1234`

**Done when:** `npm run db:reset` creates and seeds the database without errors.

> Verified: `db:migrate` + `db:seed` (run twice, idempotent). `db:reset` itself is blocked for AI agents by Prisma's consent guard — user to run once to confirm.

---

## Phase 3 — AI layer

- [x] `lib/prompts.ts` with all prompts from PROMPTS.md as functions that fill the placeholders
- [x] `lib/ai.ts`: `pipReply(session, history)`, `evaluateSession(session)`, `generateLesson(conceptState)`; uses `GEMINI_MODEL`; parses and strips the `<covered>` tag; JSON responses validated with zod, one retry
- [x] `lib/demo-responses.ts`: scripted Photosynthesis conversation, evaluation and lesson
- [x] Demo mode: used when `DEMO_MODE=true`, when no API key is set, or when an API call fails
- [x] Simple in-memory rate limit for AI routes (10 per minute per user)

**Done when:** a small test script (or route) gets a Pip reply both with the real API and with `DEMO_MODE=true`.

- [x] Demo mode: `bash scripts/ai-smoke.sh` passes (Pip reply, evaluation, lesson); no-key and failing-API paths fall back to demo.
- [x] Real API: verified by user (`npm run ai:check`, and `DEMO_MODE=false bash scripts/ai-smoke.sh` in the user's own terminal).

---

## Phase 4 — Auth

- [x] Sign-up page (name, email, password) → creates user with 7-day trial, logs in
- [x] Login and logout; HTTP-only session cookie; passwords hashed with bcrypt
- [x] `getCurrentUser()` helper; protected pages redirect to login
- [x] Referral: `/signup?ref=CODE` links the new user to the referrer
- [x] All auth routes call `checkRequest()` from `lib/botlens.ts` (see CLAUDE.md)

**Done when:** you can sign up, log out, log in with the demo account, and protected pages redirect.

---

## Phase 5 — Core learning flow (most important)

- [x] **Topic library** `/library`: grid of topic cards, filter by subject, search, difficulty
- [x] **Topic detail** `/library/[slug]`: summary, concept list (with user's states if logged in), reviews, "Teach this to Pip" button
- [x] **Teach session** `/teach/[topicId]`: creates a TeachSession; Pip's fixed opening message; chat UI from DESIGN.md; Pip state changes (thinking while waiting, confused when asking, got-it when a concept is covered); concept progress dots; "Finish session" button
- [x] **Voice**: mic button using the Web Speech API (speech-to-text into the input); toggle for Pip reading replies aloud with `speechSynthesis`; hide the mic gracefully if the browser doesn't support it
- [x] **Gap report** `/report/[sessionId]`: runs the evaluation once, saves ConceptStates, shows score ring, concept list with evidence quotes and feedback, "Fix this gap" buttons, Pip summary; awards points
- [x] **Mini-lesson** `/lesson/[conceptStateId]`: generates and caches the lesson; gap box, body, example, 2 check questions with instant feedback; "Teach Pip again" starts a new session on the same topic
- [x] **Understanding Map** `/map`: all concepts grouped by topic, colored nodes with labels, legend, tap for evidence and date
- [x] `/dashboard` after login: continue last session, weakest concepts, streak, upcoming live events

**Done when:** with the demo account, the full loop works end to end in demo mode AND with the real API: library → teach → finish → report → lesson → teach again → map updates.

- [x] Demo mode: `bash scripts/e2e.sh learning.py` passes at 375px and 1280px (`WIDTH=1280`).
- [x] Real API: verified by user (run the same loop in the browser with `DEMO_MODE=false` and a key in `.env`).
> Manual check for the user: voice input/output in a real browser with a microphone (headless tests can't).

---

## Phase 6 — Platform features (bot targets)

- [x] **Live** `/live`: list of live sessions and weekly challenges; countdown until booking opens; seat bar (DESIGN.md); "Book seat" enabled only when open; seats update every 2 seconds; one booking per user; sold-out state
- [x] **Leaderboard** `/leaderboard`: monthly ranking by points, streaks, prize banner, current user highlighted
- [x] **Community** `/community`: thread list with topic tags, thread page with replies, new thread and reply forms (logged in only)
- [x] **Reviews**: star rating + text on topic detail page (logged in, one per user per topic)
- [x] **Pricing** `/pricing`: Free, Pro (€9/month), Team; Pro highlighted
- [x] **Checkout** `/checkout?plan=pro`: promo code field (validates code, shows discount), fake card form with validation (no real payments, show a "Demo — no real payment" note), creates an Order, upgrades the plan, success page
- [x] **Referral** `/referral`: personal link with copy button, list of invited friends, "1 free week per friend" reward
- [x] **Profile** `/profile`: name, plan, trial days left, stats

**Done when:** each feature works with the demo account and with a newly signed-up user.

> Verified: `bash scripts/e2e.sh platform.py check-404.sh` (demo + new user, incl. live seat polling seen from a second browser).

---

## Phase 7 — BotLens integration points

- [ ] `lib/botlens.ts` with `checkRequest(req, action)` returning `{ allow: true }` for now, and a typed result `{ allow, challenge?, reason? }`
- [ ] Called at the start of every route for these actions: `login`, `signup`, `book_seat`, `apply_promo`, `checkout`, `post_forum`, `post_review`, `referral_claim`, `leaderboard_submit`, `ai_message`
- [ ] 403 handling (blocked message) and 429 handling ("Please verify you're human" modal) in the frontend
- [ ] Commented slot for the BotLens tracking script in `app/layout.tsx`
- [ ] Stable `id`/`name` on all forms and `data-action` on important buttons
- [ ] Topic and lesson text is server-rendered
- [ ] Respect `X-Forwarded-For` / `X-Real-IP` when reading the client IP (we run behind Nginx)
- [ ] Write `BOTLENS.md`: list of all actions, routes, request shapes and how to plug in

**Done when:** temporarily switching `checkRequest` to block shows the right UI on every protected action.

---

## Phase 8 — Landing page and polish

- [ ] Landing page `/` exactly as described in DESIGN.md (hero with Pip + sample chat, how it works, gap report preview, why teaching works, live teaser with countdown, pricing teaser, demo testimonials, footer)
- [ ] Page titles, meta descriptions, Open Graph image, favicon (Pip)
- [ ] 404 and error pages in brand style
- [ ] Loading skeletons and empty states on every page
- [ ] Full mobile pass at 375px: no horizontal scroll, tap targets ≥ 44px
- [ ] Accessibility pass: labels, focus, contrast, keyboard navigation in the chat
- [ ] Remove any leftover placeholder text

**Done when:** every page passes the DESIGN.md checklist.

---

## Phase 9 — Deployment and demo readiness

- [ ] `npm run build` and `npm start` work locally in production mode
- [ ] Write `DEPLOY.md` following SETUP.md section 8 (PM2 + Nginx + certbot) with the exact commands for this project
- [ ] `ecosystem.config.js` for PM2
- [ ] Script `npm run demo:reset` that reseeds the database and sets the demo live event to open 3 minutes from now
- [ ] Write `DEMO.md`: the exact click path for the stage demo, using the demo account and the Photosynthesis topic, with demo-mode fallback
- [ ] Final check of the whole site with webapp-testing

**Done when:** a fresh clone can be deployed by following DEPLOY.md, and DEMO.md runs start to finish.

---

## Decisions log

Add one line per decision: date · decision · reason.

- 2026-11-02 · Next.js 16 set up by hand (no create-next-app) · folder already had kit files.
- 2026-11-02 · Prisma pinned to 6.19 (not 7/8-rc) · v6 loads `.env` automatically and needs no driver adapter, matching CLAUDE.md; `latest` on npm is an rc.
- 2026-11-02 · Tailwind v4: tokens mapped with `@theme` in `globals.css` instead of `tailwind.config` · v4 is CSS-first; same effect.
- 2026-11-02 · Tailwind `source(none)` + explicit `@source` for app/components/lib · auto-scan of the whole folder trips over `.claude`/`.venv`.
- 2026-11-02 · npm 12 blocks install scripts: approved `prisma`, `@prisma/client`, `@prisma/engines`, `esbuild` (needed for engines and tsx); denied no-op/optional ones.
- 2026-11-02 · Gemini models: main `gemini-3.6-flash`, fallback `gemini-3.5-flash` (code defaults) · gemini-2.5-flash no longer available to new keys.
- 2026-11-02 · Concept pills use ink text with state-coloured icon/border/tint · status colours as text on light bg fail AA, and DESIGN.md forbids new colours.
- 2026-11-02 · Links and coral text use `--coral-dark`; primary buttons keep `--coral` bg with white text per DESIGN.md (3.7:1, AA-large/UI only) · brand look vs AA trade-off, recorded here.
- 2026-11-02 · Tailwind default palette removed (`--color-*: initial`) · makes off-token colours impossible.
- 2026-11-02 · Teach session renders as a full-screen layer over the site chrome · keeps one root layout while giving the chat a fixed input bar.
- 2026-11-02 · Playwright: try `/usr/bin/chromium` first, fall back to Playwright's cached headless shell · system Chromium aborts inside the Claude sandbox (socket() not permitted).
- 2026-11-02 · (user) The sandbox blocks every process from reading `.env`/`.env.*` · Prisma keeps `url = env("DATABASE_URL")`; every Prisma npm script sets `DATABASE_URL=${DATABASE_URL:-file:./dev.db}` (overridable). DB file: `prisma/dev.db`.
- 2026-11-02 · Same `DATABASE_URL` default also on `dev`, `build`, `start` · the running app's Prisma client needs it too; a real env still overrides it.
- 2026-11-02 · (user) `SESSION_SECRET` missing → fixed dev-only fallback with a warning in development; throws in production.
- 2026-11-02 · (user) Missing `GEMINI_API_KEY` → demo mode (expected in Claude's sandboxed runs). Real-API checks in phases 3 and 5 are ticked as "verified by user"; `npm run ai:check` lets the user test models from their own terminal.
- 2026-11-02 · (user) `.env.example` already updated by the user (gemini-3.6-flash, GEMINI_FALLBACK_MODEL=gemini-3.5-flash); Claude never reads or edits it.
- 2026-11-02 · (user) Prefer single commands; multi-step checks live in `scripts/*.sh`, run with `bash scripts/<name>.sh`.
- 2026-11-02 · Prisma seed runs via `node --import tsx` instead of the `tsx` CLI · the tsx CLI opens a Unix-socket IPC pipe that the sandbox blocks.
- 2026-11-02 · `prisma migrate reset` is gated by Prisma's AI-agent consent check · Claude verifies with `db:seed` (which wipes its own tables); `demo:reset` will reseed without `migrate reset`.
- 2026-11-02 · Points: 50 per finished session, 30 per gap closed; monthly leaderboard sums `PointEvent` rows in the current month.
- 2026-11-02 · Seed adds 5 extra "learner" accounts so the sold-out event really has 30 bookings · only 25 named users exist.
- 2026-11-02 · Demo account is "Jordan Ellis" with 3 finished topics; Photosynthesis left untouched for the stage demo.
- 2026-11-02 · Demo mode also covers non-Photosynthesis topics with generic Pip replies, a keyword-based evaluation and a lesson built from the concept description · the whole site keeps working offline, not just the stage topic.
- 2026-11-02 · Gemini retry rule: retry once after 1s only on HTTP 503/429; any other failure (incl. network) goes straight to the fallback model, then demo mode · matches the brief, avoids slow double-failures.
- 2026-11-02 · Bad JSON from the model (twice) raises `AiFormatError` → friendly error, not demo mode · CLAUDE.md: "retry once, then show a friendly error".
- 2026-11-02 · Pip's fixed opening is not sent to Gemini (history must start with a user turn) · it's static text anyway.
- 2026-11-02 · "Confused" Pip messages detected with a small regex on the reply · drives the yellow "?" tag and Pip's confused state without an extra AI call.
- 2026-11-02 · Session cookie `tb_session` holds a random token; DB stores only its HMAC-SHA256 (keyed with SESSION_SECRET) · a leaked DB can't be replayed as sessions.
- 2026-11-02 · `/signup?ref=CODE` redirects to `/auth/signup?ref=CODE` · project structure puts auth under `/auth`, PLAN uses the short link.
- 2026-11-02 · Referral free week is granted when the referrer claims it on `/referral` (`referral_claim` action), not automatically on sign-up · gives BotLens a real claim endpoint to protect.
- 2026-11-02 · Login has its own IP rate limit (20/min) besides BotLens · cheap brute-force brake.
- 2026-11-02 · BotLens verdict UI (`BotLensGate` + `postJson`) built in phase 4 because every form uses it; ticked in phase 7.
- 2026-11-02 · e2e checks live in `scripts/e2e/*.py`, run with `bash scripts/e2e.sh <script.py>` (dev server managed by the webapp-testing helper).
- 2026-11-02 · (user) All file changes go through Claude's Edit/Write tools, never sed/awk/python/shell redirects.
- 2026-11-02 · `/teach/[topicId]` accepts slug or id; it resumes the open session for that topic, `?new=1` closes it and starts fresh ("Teach Pip again") · reloads never lose the chat.
- 2026-11-02 · Evaluation runs in `POST /api/teach/[id]/finish` (claims the session as `evaluating` first so double clicks can't evaluate twice); the report page only reads the stored result.
- 2026-11-02 · Finish route checks both `ai_message` and `leaderboard_submit` with BotLens · it calls the AI and submits points.
- 2026-11-02 · Gap report offers "Fix this gap" for gaps and "Firm this up" for shaky concepts · shaky ones benefit from a lesson too.
- 2026-11-02 · Lessons are generated during the server render of `/lesson/[gapId]` (with a skeleton `loading.tsx`) and cached in `Lesson`; regenerated when the concept state changed after the lesson was written · lesson text is server-rendered for BotLens.
- 2026-11-02 · Site header/footer hidden on `/teach/*` via `ChromeGate` · focused full-screen chat with a fixed input bar, no hidden focusable chrome.
- 2026-11-02 · Map nodes and pills use strong state tints with ink text instead of solid fills · white on `--gap` is 4.4:1, under AA.
- 2026-11-02 · Error messages use ink text with a `--gap` icon · `--gap` text on paper is ~4.1:1, under AA.
- 2026-11-02 · (user, replaces the earlier "404 as 200 is acceptable" entry) Every not-found case must be a real HTTP 404 · BotLens counts 404s to detect path brute-forcing and scanners. Fix: list pages' `loading.tsx` moved into `(index)` route groups (`/library`, `/community`) so they don't wrap the detail routes; `/teach/[topicId]`, `/report/[sessionId]`, `/lesson/[gapId]` got a segment `layout.tsx` that checks existence (and ownership when logged in) before the page's loading boundary streams. Verified with `bash scripts/check-404.sh` (curl status per bad slug).
- 2026-11-02 · e2e runs are isolated: own build dir `.next-e2e` (`NEXT_DIST_DIR`), port 3100 and database `prisma/e2e.db` (migrated + seeded per run) · a second `next dev` in the same folder was refused while the user's own dev server ran; tests must never reseed the user's `prisma/dev.db`.
- 2026-11-02 · Seeded point events fall inside the current month · the leaderboard is monthly and would be nearly empty early in a month.
- 2026-11-02 · Team plan priced at €29/month for up to 5 people · DESIGN/CLAUDE only fix Pro at €9.
- 2026-11-02 · Booking inserts first, then re-counts and rolls back if over capacity · safe last-seat race without SQLite row locks. Promo uses are incremented with a `uses < maxUses` guard for the same reason.
- 2026-11-02 · Promo check and login have their own IP rate limits (15/min, 20/min) besides BotLens · cheap protection against code guessing / brute force.
- 2026-11-02 · Referral claim extends the trial (or restarts one from Free) by 1 week per unclaimed friend and gives 20 points; Pro/Team users bank the days as `bonusDays`.
- 2026-11-02 · Fake checkout: Luhn + future expiry + 3–4 digit CVC; only the last 4 digits are stored · realistic validation, no card data kept.
- 2026-11-02 · Community also shows the latest topic reviews (DESIGN: "review cards with stars") · reviews are written on topic pages.
