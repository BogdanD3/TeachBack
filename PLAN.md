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

- [ ] Sign-up page (name, email, password) → creates user with 7-day trial, logs in
- [ ] Login and logout; HTTP-only session cookie; passwords hashed with bcrypt
- [ ] `getCurrentUser()` helper; protected pages redirect to login
- [ ] Referral: `/signup?ref=CODE` links the new user to the referrer
- [ ] All auth routes call `checkRequest()` from `lib/botlens.ts` (see CLAUDE.md)

**Done when:** you can sign up, log out, log in with the demo account, and protected pages redirect.

---

## Phase 5 — Core learning flow (most important)

- [ ] **Topic library** `/library`: grid of topic cards, filter by subject, search, difficulty
- [ ] **Topic detail** `/library/[slug]`: summary, concept list (with user's states if logged in), reviews, "Teach this to Pip" button
- [ ] **Teach session** `/teach/[topicId]`: creates a TeachSession; Pip's fixed opening message; chat UI from DESIGN.md; Pip state changes (thinking while waiting, confused when asking, got-it when a concept is covered); concept progress dots; "Finish session" button
- [ ] **Voice**: mic button using the Web Speech API (speech-to-text into the input); toggle for Pip reading replies aloud with `speechSynthesis`; hide the mic gracefully if the browser doesn't support it
- [ ] **Gap report** `/report/[sessionId]`: runs the evaluation once, saves ConceptStates, shows score ring, concept list with evidence quotes and feedback, "Fix this gap" buttons, Pip summary; awards points
- [ ] **Mini-lesson** `/lesson/[conceptStateId]`: generates and caches the lesson; gap box, body, example, 2 check questions with instant feedback; "Teach Pip again" starts a new session on the same topic
- [ ] **Understanding Map** `/map`: all concepts grouped by topic, colored nodes with labels, legend, tap for evidence and date
- [ ] `/dashboard` after login: continue last session, weakest concepts, streak, upcoming live events

**Done when:** with the demo account, the full loop works end to end in demo mode AND with the real API: library → teach → finish → report → lesson → teach again → map updates.

---

## Phase 6 — Platform features (bot targets)

- [ ] **Live** `/live`: list of live sessions and weekly challenges; countdown until booking opens; seat bar (DESIGN.md); "Book seat" enabled only when open; seats update every 2 seconds; one booking per user; sold-out state
- [ ] **Leaderboard** `/leaderboard`: monthly ranking by points, streaks, prize banner, current user highlighted
- [ ] **Community** `/community`: thread list with topic tags, thread page with replies, new thread and reply forms (logged in only)
- [ ] **Reviews**: star rating + text on topic detail page (logged in, one per user per topic)
- [ ] **Pricing** `/pricing`: Free, Pro (€9/month), Team; Pro highlighted
- [ ] **Checkout** `/checkout?plan=pro`: promo code field (validates code, shows discount), fake card form with validation (no real payments, show a "Demo — no real payment" note), creates an Order, upgrades the plan, success page
- [ ] **Referral** `/referral`: personal link with copy button, list of invited friends, "1 free week per friend" reward
- [ ] **Profile** `/profile`: name, plan, trial days left, stats

**Done when:** each feature works with the demo account and with a newly signed-up user.

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
