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

- [x] `lib/botlens.ts` with `checkRequest(req, action)` returning `{ allow: true }` for now, and a typed result `{ allow, challenge?, reason? }`
- [x] Called at the start of every route for these actions: `login`, `signup`, `book_seat`, `apply_promo`, `checkout`, `post_forum`, `post_review`, `referral_claim`, `leaderboard_submit`, `ai_message`
- [x] 403 handling (blocked message) and 429 handling ("Please verify you're human" modal) in the frontend
- [x] Commented slot for the BotLens tracking script in `app/layout.tsx`
- [x] Stable `id`/`name` on all forms and `data-action` on important buttons
- [x] Topic and lesson text is server-rendered
- [x] Respect `X-Forwarded-For` / `X-Real-IP` when reading the client IP (we run behind Nginx)
- [x] Write `BOTLENS.md`: list of all actions, routes, request shapes and how to plug in

**Done when:** temporarily switching `checkRequest` to block shows the right UI on every protected action.

> Verified: `bash scripts/e2e.sh botlens.py check-ssr.sh` — block and challenge modals on all 10 actions, raw 403/429 JSON, retry after "I'm human".

---

## Phase 8 — Landing page and polish

- [x] Landing page `/` exactly as described in DESIGN.md (hero with Pip + sample chat, how it works, gap report preview, why teaching works, live teaser with countdown, pricing teaser, demo testimonials, footer)
- [x] Page titles, meta descriptions, Open Graph image, favicon (Pip)
- [x] 404 and error pages in brand style
- [x] Loading skeletons and empty states on every page
- [x] Full mobile pass at 375px: no horizontal scroll, tap targets ≥ 44px
- [x] Accessibility pass: labels, focus, contrast, keyboard navigation in the chat
- [x] Remove any leftover placeholder text

**Done when:** every page passes the DESIGN.md checklist.

> Verified: `bash scripts/e2e.sh a11y.py check-404.sh` (15 pages at 375px: no overflow, no targets < 44px except inline text links, every control labelled; Tab + Enter in the chat) and screenshots at 375/1280.

---

## Phase 9 — Deployment and demo readiness

- [x] `npm run build` and `npm start` work locally in production mode
- [x] Write `DEPLOY.md` following SETUP.md section 8 (PM2 + Nginx + certbot) with the exact commands for this project
- [x] `ecosystem.config.js` for PM2
- [x] Script `npm run demo:reset` that reseeds the database and sets the demo live event to open 3 minutes from now
- [x] Write `DEMO.md`: the exact click path for the stage demo, using the demo account and the Photosynthesis topic, with demo-mode fallback
- [x] Final check of the whole site with webapp-testing

**Done when:** a fresh clone can be deployed by following DEPLOY.md, and DEMO.md runs start to finish.

> Verified: fresh `git clone` → `npm ci` → `db:deploy` → `db:seed` → `build` → `npm start` serves all pages (real 404s, demo login). PM2/Nginx/certbot steps need a real server — user to run.
> Verified: `DEMO_OPENS_IN_MIN=1 E2E_PROD=1 bash scripts/e2e.sh demo.py` runs the DEMO.md click path end to end (demo mode), incl. the countdown reaching 0 and booking.
> Verified: `E2E_PROD=1 bash scripts/e2e.sh auth.py learning.py platform.py a11y.py check-404.sh check-ssr.sh` all pass on a production build; `botlens.py` passes on dev (its cookie hook is off in production by design).

---

## Phase 10 — Speed, primers, lessons everywhere, voice, production readiness

Lint + build + e2e + commit after each numbered item. Never reseed `prisma/dev.db` (e2e uses its own DB).

1. Speed and streaming
   - [x] Stream Pip's replies word by word (`generateContentStream` + streaming route); strip `<covered>` while streaming, parse it from the full text at the end
   - [x] Thinking state shows immediately on send, until the first words arrive
   - [x] `PIP_THINKING` (off | low | medium, default low) mapped to the SDK thinking option; moderate thinking for evaluation, lessons, primers
   - [x] Tight `maxOutputTokens` for Pip, with room for thinking
   - [x] Fallback before the first token → fallback model; demo mode "streams" word by word
   - [x] Progress screen with changing status lines for evaluation and lessons
   - [x] Before/after timings in the Decisions log (user measures the real API)

   > Verified: `GEMINI_API_KEY=fake DEMO_MODE=false node --import tsx scripts/stream-check.ts` (tag never leaks at any chunk split; both models fail before the first token → demo, streamed word by word). `E2E_PROD=1 bash scripts/e2e.sh learning.py a11y.py` pass (partial bubble shorter than final, no tag shown). Real API: user to run `npm run ai:check` and watch `[ai] pip streamed by …` logs.
2. Hydration
   - [x] `suppressHydrationWarning` on `<body>` (Grammarly extension)
3. Learn before teaching
   - [x] Primer at `/library/[slug]/learn` (quick) and `?depth=full` (from scratch): generated once per topic + depth, cached in the DB, server-rendered; prompt in PROMPTS.md + lib/prompts.ts; demo primers
   - [x] Topic page: three start options (teach / quick primer / from scratch)
   - [x] "Peek" in the teach session: 1–2 sentence hint from the primer, costs 5 points, recorded on the session; the gap report notes peeked concepts
   - [x] DESIGN.md: primer page and Peek button

   > Verified: `E2E_PROD=1 bash scripts/e2e.sh primer.py learning.py check-404.sh check-ssr.sh` pass (start options, quick/full primer, peek costs 5 then free, peek moves on after a concept is covered, report marks 2 peeked concepts; `/library/<bad>/learn` is a real 404; primer text is in the server HTML). Screens checked at 375 and 1280 (`debug_primer.py`).
4. Lessons reachable everywhere
   - [ ] Map: shaky/gap concept → "Fix this gap" button to its lesson
   - [ ] Dashboard: "Your lessons" section; weakest concepts link to their lessons
   - [ ] Topic page lists the user's lessons for that topic
5. Voice in every browser
   - [ ] MediaRecorder + `POST /api/transcribe` (Gemini main → fallback, demo transcript), text goes into the input for review; max 60 s; `checkRequest(req, "ai_message")`
   - [ ] Mic shown wherever MediaRecorder + getUserMedia exist; speechSynthesis kept for Pip's voice
6. DEMO.md
   - [ ] New flow: primer → teach with streaming → peek → report → lesson
7. Production readiness
   - [ ] `GET /api/health` → `{ ok, db, ai }`
   - [ ] `scripts/deploy.sh` (pull, ci, migrate deploy, build, pm2 restart; never seeds)
   - [ ] `scripts/backup-db.sh` (timestamped copy, keep 14), `backups/` ignored, cron line in DEPLOY.md
   - [ ] Secure cookies in production; `botlens_force` cookie off in production; refuse to start in production if `DEMO_MODE` unset or `SESSION_SECRET` < 32 chars
   - [ ] DEPLOY.md: fresh-server walkthrough (Node LTS, PM2, Nginx + X-Forwarded headers, certbot) + update flow with `scripts/deploy.sh`

**Done when:** every item above is ticked, each committed separately, and the e2e suites pass.

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
- 2026-11-02 · BotLens test hooks: `BOTLENS_FORCE=block|challenge` env (all actions) and, outside production only, a `botlens_force=<verdict>[@a+b]` cookie for per-action forcing · lets one e2e run check every action's UI without editing code.
- 2026-11-02 · BotLens challenge modal has an empty `#botlens-challenge-slot` for their widget and an "I'm human, try again" button that replays the original request.
- 2026-11-02 · e2e scripts warm up routes first · the dev server's first compile of a route can reload the page mid-test.
- 2026-11-02 · Landing "demo" section is a static render of the real gap report in a browser frame, with a commented slot for a video · no recording exists yet; DESIGN asks for a screenshot.
- 2026-11-02 · Landing live teaser shows the next event whose booking hasn't opened (falls back to the next upcoming one) · that's the one with a countdown.
- 2026-11-02 · Every page with a `loading.tsx` that can 404 gets an existence-check layout; `/checkout` form and skeleton moved into `(form)` so `/checkout/success` keeps real 404s.
- 2026-11-02 · Tap-target rule: ≥ 44px for every control except inline links inside running text (WCAG 2.5.5 exception); checked by `scripts/e2e/a11y.py`.
- 2026-11-02 · Missing `SESSION_SECRET` in production: `instrumentation.ts` logs `[startup] …` and exits with code 1 · Next would otherwise keep running without serving pages; PM2 shows a clear crash.
- 2026-11-02 · `metadataBase` comes from the request host (`X-Forwarded-Host/Proto` behind Nginx) · absolute OG URLs without a new env var (Claude can't edit `.env.example`).
- 2026-11-02 · PM2 runs one `next start` instance on 127.0.0.1:3000 and takes `DATABASE_URL` etc. from `.env` · in-memory rate limits + SQLite single writer.
- 2026-11-02 · `demo:reset` = `migrate deploy` + seed with `DEMO_OPENS_IN_MIN=3` (no `migrate reset`) · seed wipes its own tables; avoids Prisma's AI consent gate and works on the server.
- 2026-11-02 · e2e scripts wait for streamed content, not `networkidle` · production client navigation finishes before the streamed page arrives.
- 2026-11-02 · Community also shows the latest topic reviews (DESIGN: "review cards with stars") · reviews are written on topic pages.
- 2026-11-02 · (phase 10) Pip streams as NDJSON over a POST fetch (`delta` lines, then one `done` line with id/covered/confused after the DB save), not SSE · keeps the POST body and the JSON error responses (BotLens 403/429, rate limit) exactly as before; `postStream` shares `postJson`'s error handling.
- 2026-11-02 · Hiding `<covered>` mid-stream: visible text = everything before `<covered`, also holding back a trailing partial like `<cov` · the final reply and covered list are parsed from the full text when the stream ends and replace the streamed bubble.
- 2026-11-02 · `PIP_THINKING` → `thinkingConfig.thinkingLevel` (SDK 2.32): off → `MINIMAL`, low → `LOW` (default), medium → `MEDIUM` · Gemini 3 models take thinking levels (`thinkingBudget` is the 2.5-era knob) and Flash can't switch thinking fully off, MINIMAL is the lowest. If a model answers HTTP 400 to a thinking level, the same model is retried once without it. **User: add `PIP_THINKING=low` to `.env.example` (Claude can't edit it).**
- 2026-11-02 · Evaluation, lessons and primers use thinking level `MEDIUM` · "moderate"; the Gemini 3 default is high/dynamic, so this is also faster than before.
- 2026-11-02 · Pip `maxOutputTokens`: off 400 / low 1200 / medium 2400 · the visible reply + tag is ~150 tokens, but Gemini counts thinking tokens against the same cap; JSON calls stay uncapped. Gemini HTTP timeout 20 s → 30 s · lessons were already ~15 s.
- 2026-11-02 · Stream failures: the fallback rules (retry on 503/429, then fallback model) apply until the first non-empty chunk; after that a broken stream keeps the text that arrived (logged) · switching models mid-sentence would show two different answers. No text at all → demo reply.
- 2026-11-02 · Demo replies "stream" one word every 35 ms · looks the same as the real thing, ~0.8 s per reply.
- 2026-11-02 · If the browser disconnects mid-stream the server finishes the reply and saves it · a reload shows Pip's answer instead of a dangling question.
- 2026-11-02 · Chunks are shown as they arrive, no client-side typewriter smoothing · honest latency, less code; a blinking coral caret marks the streaming bubble.
- 2026-11-02 · Chat list is `aria-busy` while Pip streams · screen readers announce the finished reply once, not every word; e2e waits for `aria-busy="false"` (`wait_pip`).
- 2026-11-02 · Timings. Before (user, real API): nothing visible until the full reply, 5–10 s; lessons ~15 s behind a static skeleton. After, demo mode on a production build (`learning.py`): thinking bubble 23 ms after Enter, first words 106 ms, full reply 852 ms. Real API to be measured by the user: the server logs `[ai] pip streamed by <model>: first text X ms, done Y ms` and `[ai] lesson answered by <model> in X ms`; `npm run ai:check` now also prints stream first-words/done times for the current `PIP_THINKING`.
- 2026-11-02 · (user) `suppressHydrationWarning` on `<body>` only · it silences attribute mismatches on that one element (Grammarly adds `data-gr-*`), not on the page content.
- 2026-11-02 · Primers: new `Primer` table (unique per topic + depth `quick|full`), migration `primers_peeks`; `TeachSession.peeks` stores peeked concept names · **User: run `npm run db:deploy` once on your `prisma/dev.db`** (applies the migration, no reset/seed; Claude never touches dev.db).
- 2026-11-02 · Only Gemini primers are cached; when the API is down the demo primer is rebuilt per request · otherwise one outage would pin a canned primer forever. The primer route is public (content page, server-rendered for BotLens) and rate-limited per user, or per IP for visitors.
- 2026-11-02 · "Teach me from scratch" = the same page with `?depth=full`: a longer primer with "Going deeper" and "Common mistake" per concept · one prompt with a depth switch, cached separately.
- 2026-11-02 · Each primer concept carries a 1–2 sentence `hint`; Peek shows it (cached primer → demo primer → concept description), so Peek never calls the AI.
- 2026-11-02 · Peek picks the uncovered concept whose name shares the most words with Pip's last message, else the first uncovered one in topic order · cheap guess at "the concept Pip is asking about" without an AI call.
- 2026-11-02 · Peek costs 5 points once per concept per session (re-peeking is free), recorded as a negative `PointEvent` (`reason: peek`); points never go below 0 · new users with 0 points can still peek. No BotLens check on peek · it only costs the user points and isn't on the action list.
- 2026-11-02 · Gap report shows a neutral "Peeked" badge per concept plus a one-line summary; the evaluation prompt is unchanged · the AI grades what was explained, the badge tells the user they had help.
- 2026-11-02 · Chat placeholder shortened to "Explain it to Pip…" · the old text wrapped inside the 48px input at 375px.
- 2026-11-02 · Gap report and lesson waits show `ProgressSteps`: Pip thinking + status lines that tick every 2.6 s and stop on the last one · the work is one server call, so the lines are paced, not real progress events.
