# DEMO.md — the 5-minute stage demo

Account: **demo@teachback.app / demo1234** (Jordan Ellis). Topic: **Photosynthesis**. Works with the real API and in demo mode.

## Before you go on stage (T − 5 min)

1. `npm run demo:reset` — fresh data. The "Explain-off: Photosynthesis" live event opens for booking **3 minutes** later. Note the time it prints.
2. `npm run ai:check` — shows which Gemini model answers. If both fail, or the Wi-Fi is shaky: set `DEMO_MODE=true` in `.env` and restart (`pm2 restart teachback --update-env`, or restart `npm run dev`). Demo mode answers exactly the script below.
3. Open `/library/photosynthesis/learn` once (the reseed cleared the primer cache; the first open generates it, ~10 s with the real API). `curl -s https://<your-domain>/api/health` should say `"db":true`.
4. Open the site on the laptop (projector) and put the QR code to the landing page on the slide for judges' phones.
5. Have the backup video ready in another tab.

## Click path

| # | Do | Say |
|---|---|---|
| 1 | Landing page `/`. Point at Pip and the sample chat. | "You don't really know something until you can teach it. Teachback gives you a student: Pip." |
| 2 | **Log in** (top right) with the demo account → dashboard. | "Jordan has done three topics this week." |
| 3 | **Library** → **Photosynthesis**. Point at the three start options, tap **Quick primer first**. Scroll through two concepts (example boxes), jump to the end. | "Not ready to teach yet? A 3-minute primer first — or from scratch if it's all new." |
| 4 | **Now teach it to Pip** → the chat opens. Send messages 1–3 below (paste, or tap the mic and read message 1 aloud, check the text, send). Point out that Pip's "thinking…" shows instantly and the answer **streams in word by word**. | "Pip has never heard of photosynthesis. It asks what a real beginner asks." |
| 5 | Pretend to be stuck: tap **Peek · 5 pts** → a one-line hint on the light-dependent reactions. Close it, send messages 4–6. Watch the concept dots fill up. | "Stuck? Peek costs 5 points — and the report remembers you peeked." |
| 6 | **Finish session** → the progress screen ticks through its steps → gap report: **5 of 7 solid**, "Where the oxygen comes from" shaky, **Calvin cycle = gap**, a **Peeked** badge on light-dependent reactions, quotes from what you typed, Pip's summary, +50 points. | "I never explained the Calvin cycle. Teachback noticed — with my own words as evidence." |
| 7 | **Fix this gap** on Calvin cycle → mini-lesson: gap box, bakery analogy, answer the 2 check questions (B, then C). | "A 2-minute lesson for exactly that gap." |
| 8 | **Teach Pip again** → fresh session. Open **Understanding Map** from the user menu → Photosynthesis, tap **Calvin cycle** → **Fix this gap** leads back to the lesson. The dashboard lists it under **Your lessons**. | "Every concept I've taught, coloured by how well I explained it — and every lesson one tap away." |
| 9 | **Live** → the Photosynthesis explain-off: countdown → when it hits 0 the button turns coral → **Book seat**. Ask a judge to book on their phone: the seat bar updates within 2 seconds. | "30 seats. This is exactly what bots love to grab." |
| 10 | **Leaderboard**: Jordan's row is highlighted and moved up. | "Points for every session and every gap closed." |
| 11 | Hand over to BotLens. | "Every one of these actions is wired to BotLens — sign-up, login, seats, promo codes, forum, AI." (see `BOTLENS.md`) |

### Messages for steps 4 and 5

Messages 1–3 in step 4, then Peek, then 4–6 in step 5.

1. `Photosynthesis is how plants make their own food. Chlorophyll, the green pigment in leaves, captures light energy.`
2. `They take in water through their roots and carbon dioxide from the air through tiny pores called stomata.`
3. `It all happens inside the chloroplasts in the leaf cells.`
4. `In the light-dependent reactions, light energy splits water and makes ATP.`
5. `The oxygen we breathe comes from splitting that water.`
6. `Then the plant makes glucose, which it uses for energy or stores as starch.`

Deliberately skip the Calvin cycle — that's the gap the report finds.

With the real API Pip's wording varies, and the report may grade a little differently; the Calvin cycle gap shows up reliably because it's never explained. Peek picks the concept Pip seems to be asking about, so with the real API it may hint at a different concept. In demo mode the replies, the peek, the voice transcript (message 1) and the report are exactly as described.

The first time a primer is opened it's generated (~10 s with the real API, the progress screen shows meanwhile) and then cached. Open `/library/photosynthesis/learn` once before going on stage so it's instant.

## If something goes wrong

| Problem | Do |
|---|---|
| Pip is slow / API errors | Nothing — the app falls back to the fallback model, then demo mode, automatically. For a guaranteed script set `DEMO_MODE=true`. |
| Booking already open (you took too long) | Fine — book directly. For a fresh countdown run `npm run demo:reset` again (wipes data, re-login). |
| "Pip needs a breather" | AI rate limit (10/min per user). Wait 30 s or log in as a new sign-up. |
| Mic doesn't work | Type instead. The mic needs HTTPS (or localhost) and microphone permission; it works in Chrome, Edge, Firefox and Safari. |
| Pip's reply appears all at once instead of word by word | A proxy is buffering the stream: check the Nginx config in DEPLOY.md (`proxy_buffering off` for `/api/teach/`). Everything still works. |
| Anything else | Switch to the backup video. |
