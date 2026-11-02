# PROMPT.md — paste this into Claude Code

## Kickoff prompt

```
You are building Teachback, our hackathon project, from start to finish.

All the information you need is in these files. Read every one of them fully before you write any code:
- CLAUDE.md: what we are building, tech stack, project structure, AI rules, environment rules, BotLens integration points, coding rules
- DESIGN.md: brand, colors, fonts, components, every screen
- PROMPTS.md: all AI prompts and demo mode
- PLAN.md: the build plan in 10 phases with tasks and "Done when" checks
- SETUP.md: setup and deployment notes for our own server (no Vercel)

Environment facts:
- Secrets are in .env. You may not read or edit it. If .env is missing, tell me and stop.
- Python is in .venv (Playwright installed). Use .venv/bin/python for the webapp-testing skill.
- Launch Playwright with the system Chromium: p.chromium.launch(executable_path="/usr/bin/chromium").
- The folder already contains the kit files, .venv and .claude. Set up Next.js around them without overwriting anything (see PLAN.md phase 0).

How to work:
1. Work through PLAN.md phase by phase, in order, starting from the first unticked task. Don't skip ahead.
2. Before each phase, briefly write which files you will create or change, then build it.
3. Tick each task in PLAN.md as soon as it's done.
4. At the end of each phase: run npm run lint and npm run build and fix all errors; start the dev server and open the new pages with the webapp-testing skill at 375px and 1280px; check every "Done when" condition; then commit with the message "phase N: <name>".
5. Follow DESIGN.md exactly. Use the frontend-design skill for quality, but where it disagrees with DESIGN.md, DESIGN.md wins.

Work on your own. Don't stop to ask me questions. When something is unclear, choose the option that best fits CLAUDE.md and DESIGN.md, and write it in the Decisions log at the bottom of PLAN.md.

Stop only if you are truly blocked, for example a missing .env, or a command you're not allowed to run. If the Gemini API fails, use demo mode and keep going.

If your context is getting full, make sure PLAN.md is up to date and committed, so the next session can continue from it.

When everything in PLAN.md is ticked, or you have to stop, give me a short summary: which phases are done, what I should test by hand, the decisions you made, and anything that needs my action.
```

## Continue prompt

Use after `/clear`, or when a session stopped:

```
Continue with PLAN.md from the first unticked task. Read CLAUDE.md, DESIGN.md and PLAN.md first, and follow the same rules as before: work phase by phase, tick tasks, lint + build + webapp-testing check + commit at the end of each phase, log decisions in PLAN.md, and don't stop to ask questions.
```

## Fix prompt

When something is wrong:

```
<describe the problem precisely: page, screen width, what happens, what should happen>
Fix it, check it with the webapp-testing skill, run lint and build, and commit. Add a line to the Decisions log if you changed any behavior.
```
