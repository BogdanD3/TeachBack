# SETUP.md — Getting started with Teachback

## 1. Get a free Gemini API key

1. Go to Google AI Studio (aistudio.google.com) and sign in with a Google account.
2. Click **Get API key** → **Create API key**.
3. In AI Studio, check which **Flash** model is currently offered on the free tier and copy its model name. We use `gemini-3.6-flash` with `gemini-3.5-flash` as the fallback (`gemini-2.5-flash` is no longer available to new keys).

Free tier notes:
- It costs nothing and needs no credit card, but has per-minute and per-day request limits. Check your exact limits in AI Studio, since Google changes them.
- On the free tier, Google may use your prompts to improve its products. Fine for a demo; don't type real personal data.
- Use the Flash model, not Pro. It's faster and has more generous free limits.
- Each team member can make their own key for development, so you don't share one daily limit.

**Backup:** if Gemini limits become a problem, Groq (console.groq.com) also has a free tier with fast open models, and `DEMO_MODE=true` uses canned answers with no API at all.

## 2. Prepare the project folder

The kit unpacks straight into your project folder. Claude creates the Next.js app itself (phase 0 of PLAN.md), so you don't run create-next-app.

```bash
cd ~/personal/codestuff/AI/TeachBack
unzip teachback-kit.zip            # kit files land in this folder
git init                           # if not done yet
cp .env.example .env               # then put your real key in .env
```

Fill in `.env`:

```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.6-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash
DEMO_MODE=false
SESSION_SECRET=any-long-random-string
DATABASE_URL="file:./dev.db"
```

Claude is not allowed to read or change `.env` (see `.claude/settings.local.json`).

## 3. Python and Playwright (for the webapp-testing skill)

Already done on Bogdan's machine. For a new machine:

```bash
python -m venv .venv
source .venv/bin/activate
pip install playwright
playwright install chromium      # if this download fails (e.g. on Arch), use the system Chromium:
sudo pacman -S chromium          # Arch; other distros: their chromium package
```

CLAUDE.md tells Claude to use `.venv/bin/python` and `/usr/bin/chromium` (with a fallback if that path doesn't exist).

## 4. Skills

Copy these two official Anthropic skills into `.claude/skills/` (github.com/anthropics/skills):

- **frontend-design**: makes Claude design distinctive UIs instead of generic templates
- **webapp-testing**: lets Claude open the site with Playwright and check pages actually work

```bash
git clone https://github.com/anthropics/skills.git /tmp/anthropic-skills
mkdir -p .claude/skills
cp -r /tmp/anthropic-skills/skills/frontend-design .claude/skills/
cp -r /tmp/anthropic-skills/skills/webapp-testing .claude/skills/
```

`DESIGN.md` wins over the frontend-design skill: it defines your brand, the skill raises general quality.

## 5. Permissions

`.claude/settings.local.json` lets Claude work without asking every time: edit files, run npm/npx/node, Prisma, git (no push), the `.venv` Python, and curl to localhost. It blocks reading or editing `.env` and secrets, `sudo`, `rm -rf`, `git push`, `git reset --hard` and `git clean`. Deleting files (`rm`) is not pre-approved, so Claude asks you first.

This file is personal (Claude Code keeps it out of git). It overrides allow/ask settings from your global config for this project only. Deny rules always win, so if your global settings explicitly **deny** something (e.g. all Bash), this file can't undo that: remove that deny rule globally or move it to an "ask" rule.

Then open Claude Code in the folder and send the prompt from `PROMPT.md`.

## 6. Splitting work between the two of you

| Person A — "core learning" | Person B — "platform" |
|---|---|
| lib/ai.ts, prompts, demo mode | Design tokens, components/ui, landing page |
| Teach session + Pip | Auth (sign-up, login, free trial) |
| Gap report, mini-lesson | Live sessions + countdown + seats |
| Understanding Map | Leaderboard, community, reviews |
| Topic library | Pricing, checkout, promo codes, referral |

Do the design tokens and base components together on day 1, so both halves look the same.

## 7. Suggested week

| Day | Goal |
|---|---|
| 1 | Setup, design tokens, base components, styleguide, database + seed |
| 2 | Pip + teach session working end to end (text) |
| 3 | Gap report, mini-lesson, Understanding Map / Auth + landing page |
| 4 | Library, voice input / Live sessions, leaderboard |
| 5 | Community, pricing, checkout, referral, BotLens hooks |
| 6 | Polish, mobile check, demo mode, meet BotLens team to connect |
| 7 | Deploy to your own server, rehearse demo, record backup video |

## 8. Deploying to your own server

SQLite works fine here, because the database file stays on your server's disk.

1. **Install Node.js** (LTS) and git on the server.
2. **Clone and build:**
   ```bash
   git clone <your-repo> teachback && cd teachback
   npm ci
   cp .env.example .env   # then fill in the real values
   npx prisma migrate deploy
   npx prisma db seed
   npm run build
   ```
3. **Keep it running with PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name teachback -- start
   pm2 save && pm2 startup
   ```
4. **Nginx as reverse proxy** (`/etc/nginx/sites-available/teachback`):
   ```nginx
   server {
       server_name teachback.yourdomain.com;
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Enable it, then `sudo nginx -t && sudo systemctl reload nginx`.
5. **HTTPS:** `sudo certbot --nginx -d teachback.yourdomain.com`. The mic (voice input) only works on HTTPS.
6. **Updating:** `git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart teachback`.

The `X-Real-IP` and `X-Forwarded-For` headers matter for BotLens: without them every visitor looks like it comes from 127.0.0.1. Back up the SQLite file (`prisma/dev.db` or whatever you name it) before the demo.
