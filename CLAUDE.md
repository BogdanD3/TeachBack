# CLAUDE.md — Teachback

Read this file and `DESIGN.md` before every task. `PROMPTS.md` holds the AI prompts. `PLAN.md` is the build plan and progress tracker: always continue from its first unticked task and keep it updated.

## What we are building

**Teachback** is an AI learning platform where the user learns by teaching. The user explains a topic to **Pip**, a deliberately confused AI student. Pip asks naive questions, misunderstands, and pushes back like a real beginner. When the user can't explain something, Teachback finds the exact gap, gives a short targeted lesson, and updates the user's **Understanding Map**.

This is a **hackathon demo** (one week, 2 people on this site). It must look and feel like a real product, but it does not need production-grade infrastructure. A second team is building **BotLens**, a bot detection system that will protect this site. Our site must include realistic features that bots attack (limited seats, sign-ups, login, promo codes, forum, leaderboard).

## Tech stack (do not change without asking)

| Part | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS, tokens from `DESIGN.md` |
| Components | Hand-built components in `components/ui` (no heavy UI kit) |
| Icons | lucide-react |
| Animation | framer-motion (sparingly) |
| AI | Google Gemini API via `@google/genai`, called **only from server code** |
| Database | SQLite + Prisma |
| Auth | Simple email + password with hashed passwords (bcrypt) and an HTTP-only session cookie |
| Validation | zod on every API route |

## Project structure

```
app/
  (marketing)/page.tsx          Landing page
  (marketing)/pricing/page.tsx  Pricing + plans
  library/                      Topic library + topic detail
  teach/[topicId]/              Teach session with Pip (core feature)
  report/[sessionId]/           Gap report after a session
  lesson/[gapId]/               Targeted mini-lesson
  map/                          Understanding Map
  live/                         Live sessions + weekly challenges (limited seats)
  leaderboard/                  Leaderboard with monthly prizes
  community/                    Forum + topic reviews
  checkout/                     Checkout with promo codes (fake payment)
  auth/login, auth/signup       Login, sign-up, free trial
  profile/, referral/           Profile, referral rewards
  api/...                       All server routes
components/ui/                  Buttons, cards, inputs, badges, modals
components/teach/               Chat, Pip avatar, mic button
lib/ai.ts                       Single place that talks to Gemini
lib/prompts.ts                  Prompts copied from PROMPTS.md
lib/db.ts                       Prisma client
lib/botlens.ts                  BotLens integration stubs (see below)
prisma/schema.prisma, prisma/seed.ts
```

## Features, in priority order

Build in this order. Never start a lower item while a higher one is broken.

1. **Teach session** (`/teach/[topicId]`) — chat with Pip. Text input plus optional voice (browser Web Speech API for speech-to-text, `speechSynthesis` for Pip's voice). Shows a progress bar of concepts covered. "Finish session" button.
2. **Gap report** (`/report/[sessionId]`) — after a session, AI evaluates the transcript and returns each concept as `understood`, `shaky` or `gap`, with a quote from the user as evidence.
3. **Mini-lesson** (`/lesson/[gapId]`) — short lesson (max ~300 words) + 2 check questions for one gap. "Teach Pip again" button returns to the session.
4. **Understanding Map** (`/map`) — all concepts the user touched, colored by state. Grouped by topic.
5. **Topic library** (`/library`) — seeded topics (at least 12) with concepts list, difficulty, rating.
6. **Landing page** — hero, how it works in 3 steps, demo video/GIF slot, testimonials (clearly labelled as demo), pricing teaser.
7. **Auth** — sign-up (starts a 7-day free trial), login, logout.
8. **Live sessions and weekly challenges** (`/live`) — events with a fixed seat count (e.g. 30), a countdown until booking opens, and a "Book seat" button. Seats decrease in real time (poll every 2s is fine).
9. **Leaderboard** — points for sessions finished and gaps closed. Monthly prize banner.
10. **Community** — forum threads, replies, topic reviews with star ratings.
11. **Pricing + checkout** — Free, Pro (€9/month), Team. Promo code field. Fake card form (never real payments).
12. **Referral** — personal referral link, "invite a friend, get a free week".

## AI rules

- All Gemini calls go through `lib/ai.ts`. Never call the API from client components. The API key is only in `.env` as `GEMINI_API_KEY`.
- Model name comes from `GEMINI_MODEL` in `.env` (default to a current Gemini Flash model).
- Prompts live in `lib/prompts.ts`, copied from `PROMPTS.md`. Don't write prompts inline in routes.
- Evaluation and lesson calls must return **JSON**. Validate with zod. If parsing fails, retry once, then show a friendly error.
- **Demo mode:** if `DEMO_MODE=true` or the API fails, `lib/ai.ts` returns canned responses from `lib/demo-responses.ts` for the seeded "Photosynthesis" topic. The live stage demo must never break because of Wi-Fi or rate limits.
- Rate limit our own AI routes (max ~10 requests per minute per user) so the free tier isn't burned.
- Keep Pip's replies short (1–3 sentences) so the demo feels fast.

## BotLens integration points

The BotLens team plugs into this site later. Make it easy for them:

- `app/layout.tsx` has a clearly commented slot for the BotLens tracking `<script>`.
- `lib/botlens.ts` exports `async function checkRequest(req, action)` that currently returns `{ allow: true }`. Call it at the start of these routes, passing the action name:
  `login`, `signup`, `book_seat`, `apply_promo`, `checkout`, `post_forum`, `post_review`, `referral_claim`, `leaderboard_submit`, `ai_message`.
- If it returns `{ allow: false }`, respond with HTTP 403 and `{ error: "blocked" }`. If it returns `{ challenge: true }`, respond with HTTP 429 and show a "Please verify you're human" modal.
- Every form has a stable `id` and `name` attributes, and every important button has a `data-action` attribute (e.g. `data-action="book_seat"`). Don't randomize ids.
- Content pages (topics, lessons) render text on the server so scrapers can actually reach it (BotLens needs something to protect).

## Coding rules

- TypeScript strict mode. No `any` unless commented why.
- Server components by default; `"use client"` only when needed (chat, timers, forms).
- One component per file. Keep files under ~200 lines.
- Every page needs loading, empty and error states.
- Mobile first. Every page must work at 375px wide (judges will use phones via QR code).
- Accessibility: real `<button>`/`<label>`, visible focus rings, alt text, contrast AA.
- Seed data must look real: realistic names, topics, forum posts, review text. No "Lorem ipsum", no "Test User".
- Never commit `.env`.

## Environment and secrets

- All secrets live in `.env` (not `.env.local`). The user creates it from `.env.example`. It holds `GEMINI_API_KEY`, `GEMINI_MODEL`, `DEMO_MODE`, `SESSION_SECRET` and `DATABASE_URL="file:./dev.db"`.
- You are **not allowed to read or edit `.env`**. Never print secrets. If a new variable is needed, add it to `.env.example` with a placeholder and tell the user to add it to `.env`.
- Never run `npx prisma init` (it would overwrite `.env`). Create `prisma/schema.prisma` by hand.
- Next.js and Prisma both load `.env` automatically.

## Python and browser testing

- Python lives in the project's `.venv` (already created, Playwright already installed). For the webapp-testing skill and any Python script, always use `.venv/bin/python`, never the system `python`.
- Playwright uses the system Chromium. Always launch it with `p.chromium.launch(executable_path="/usr/bin/chromium")`. If `/usr/bin/chromium` does not exist on this machine, fall back to plain `p.chromium.launch()`.
- Start the dev server in the background before testing, and stop it when done.

## Commands

```bash
npm run dev          # start dev server at localhost:3000
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed
npm run db:reset     # reset + seed
npm run lint
npm run build        # must pass before every commit
.venv/bin/python <script.py>   # webapp-testing scripts
```

## Workflow for Claude

1. Before coding, state a short plan (files to create or change).
2. Build one feature at a time, from the priority list.
3. After each feature: run `npm run lint` and `npm run build`, open the page and check it at mobile and desktop width.
4. Follow `DESIGN.md` exactly for colors, fonts, spacing and components. Don't invent new colors.
5. Work autonomously. When something is unclear, choose the option that best fits this file and `DESIGN.md`, and record it in the Decisions log in `PLAN.md` instead of stopping to ask.
