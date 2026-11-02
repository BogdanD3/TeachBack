# DEMO.md — the 5-minute stage demo

Account: **demo@teachback.app / demo1234** (Jordan Ellis). Topic: **Photosynthesis**. Works with the real API and in demo mode.

## Before you go on stage (T − 5 min)

1. `npm run demo:reset` — fresh data. The "Explain-off: Photosynthesis" live event opens for booking **3 minutes** later. Note the time it prints.
2. `npm run ai:check` — shows which Gemini model answers. If both fail, or the Wi-Fi is shaky: set `DEMO_MODE=true` in `.env` and restart (`pm2 restart teachback --update-env`, or restart `npm run dev`). Demo mode answers exactly the script below.
3. Open the site on the laptop (projector) and put the QR code to the landing page on the slide for judges' phones.
4. Have the backup video ready in another tab.

## Click path

| # | Do | Say |
|---|---|---|
| 1 | Landing page `/`. Point at Pip and the sample chat. | "You don't really know something until you can teach it. Teachback gives you a student: Pip." |
| 2 | **Log in** (top right) with the demo account → dashboard. | "Jordan has done three topics this week." |
| 3 | **Library** → **Photosynthesis** → **Teach this to Pip**. | "Pip has never heard of photosynthesis." |
| 4 | Send the six messages below, one by one (paste or speak with the mic). Watch the concept dots fill up and Pip switch between confused (yellow "?") and got-it (lightbulb). | "Pip asks the questions a real beginner asks." |
| 5 | **Finish session** → gap report: **5 of 7 solid**, "Where the oxygen comes from" shaky, **Calvin cycle = gap**, quotes from what you typed, Pip's summary at the bottom, +50 points. | "I never explained the Calvin cycle. Teachback noticed — with my own words as evidence." |
| 6 | **Fix this gap** on Calvin cycle → mini-lesson: gap box, bakery analogy, answer the 2 check questions (B, then C). | "A 2-minute lesson for exactly that gap." |
| 7 | **Teach Pip again** → fresh session. Then open **Understanding Map** from the user menu → Photosynthesis section, tap **Calvin cycle**. | "Every concept I've taught, coloured by how well I explained it." |
| 8 | **Live** → the Photosynthesis explain-off: countdown → when it hits 0 the button turns coral → **Book seat**. Ask a judge to book on their phone: the seat bar updates within 2 seconds. | "30 seats. This is exactly what bots love to grab." |
| 9 | **Leaderboard**: Jordan's row is highlighted and moved up. | "Points for every session and every gap closed." |
| 10 | Hand over to BotLens. | "Every one of these actions is wired to BotLens — sign-up, login, seats, promo codes, forum, AI." (see `BOTLENS.md`) |

### Messages for step 4

1. `Photosynthesis is how plants make their own food. Chlorophyll, the green pigment in leaves, captures light energy.`
2. `They take in water through their roots and carbon dioxide from the air through tiny pores called stomata.`
3. `It all happens inside the chloroplasts in the leaf cells.`
4. `In the light-dependent reactions, light energy splits water and makes ATP.`
5. `The oxygen we breathe comes from splitting that water.`
6. `Then the plant makes glucose, which it uses for energy or stores as starch.`

Deliberately skip the Calvin cycle — that's the gap the report finds.

With the real API Pip's wording varies, and the report may grade a little differently; the Calvin cycle gap shows up reliably because it's never explained. In demo mode the replies and the report are exactly as described.

## If something goes wrong

| Problem | Do |
|---|---|
| Pip is slow / API errors | Nothing — the app falls back to the fallback model, then demo mode, automatically. For a guaranteed script set `DEMO_MODE=true`. |
| Booking already open (you took too long) | Fine — book directly. For a fresh countdown run `npm run demo:reset` again (wipes data, re-login). |
| "Pip needs a breather" | AI rate limit (10/min per user). Wait 30 s or log in as a new sign-up. |
| Mic doesn't work | Type instead. The mic needs HTTPS and Chrome/Edge/Safari. |
| Anything else | Switch to the backup video. |
