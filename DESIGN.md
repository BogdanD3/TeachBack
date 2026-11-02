# DESIGN.md — Teachback

The look: **a warm study desk**. Paper-colored background, ink-dark text, a highlighter-yellow accent and a bold coral for actions. Friendly and a bit playful, never childish. It should feel like a good notebook, not like a generic AI startup.

**Avoid:** purple/blue AI gradients, glassmorphism, neon glows, robot illustrations, stock photos of people at laptops, emoji as icons.

## Brand

- **Name:** Teachback
- **Tagline:** Learn it by teaching it.
- **Secondary line:** Explain it to Pip. Find out what you really understand.
- **Logo:** the word "teachback" in the display font, lowercase, with a small speech bubble replacing the dot-less "a" counter, or simply a speech-bubble mark next to the wordmark. Keep it simple enough to draw in SVG.
- **Voice:** short sentences, encouraging, honest. "You explained light reactions well. Pip got lost at the Calvin cycle." Not: "Amazing job!!! 🎉"

## Pip, the confused student

Pip is the product's face. An **original** character:
- A soft rounded blob shape (like a pebble), coral body, two dot eyes, a small mouth.
- A floating question mark appears when Pip is confused; a small lightbulb when Pip "gets it".
- States: `idle`, `thinking` (gentle bob), `confused` (tilt + question mark), `got-it` (bounce + lightbulb).
- Build Pip as an inline SVG component `components/teach/Pip.tsx` with a `state` prop. Animate with framer-motion, subtle.

## Color tokens

Define these as CSS variables in `globals.css` and map them in `tailwind.config`. Use only these.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#FBF7F0` | Page background |
| `--paper-2` | `#F3ECE0` | Cards on paper, sidebars, chat area |
| `--line` | `#E2D8C7` | Borders, dividers |
| `--ink` | `#1E2A3A` | Main text, dark buttons |
| `--ink-2` | `#5A6472` | Secondary text |
| `--coral` | `#E4572E` | Primary action, Pip, links |
| `--coral-dark` | `#C2441F` | Hover on coral |
| `--highlight` | `#FFD166` | Highlighter marks, badges, "new" |
| `--understood` | `#2E9E6B` | Concept understood |
| `--shaky` | `#E8A23A` | Concept shaky |
| `--gap` | `#D64545` | Concept gap |
| `--teal` | `#1F7A8C` | Info, live sessions |

**Dark mode** (optional, only if time): background `#161C25`, cards `#1F2733`, text `#F3ECE0`, keep coral and status colors.

Status colors must always come with a label or icon, never color alone.

## Typography

Load from Google Fonts via `next/font`.

| Role | Font | Weight | Size (mobile / desktop) |
|---|---|---|---|
| Display (hero) | Fraunces | 600 | 40 / 64px, line-height 1.05 |
| H1 | Fraunces | 600 | 32 / 44px |
| H2 | Fraunces | 600 | 24 / 32px |
| H3 | Inter | 600 | 18 / 20px |
| Body | Inter | 400 | 16px, line-height 1.6 |
| Small | Inter | 400 | 14px |
| Label / meta | JetBrains Mono | 500 | 12px, uppercase, letter-spacing 0.08em |

**Highlighter effect:** key words in headings get a yellow highlight behind them, like a marker stroke: a `<mark>` styled with a `--highlight` background covering the bottom 40% of the text, slightly rotated (−1deg). Use it at most once per section.

## Layout and spacing

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px. Nothing else.
- Max content width: 1120px. Reading width for lessons: 680px.
- Mobile gutter: 16px. Desktop gutter: 32px.
- Radius: 12px for cards, 999px for buttons and pills, 20px for chat bubbles.
- Shadows: almost none. Cards use a 1px `--line` border. On hover, cards lift with `0 4px 0 var(--line)` (a flat "paper stack" shadow), not a blurred shadow.

## Components

**Buttons**
- Primary: coral background, white text, pill shape, 48px tall, font Inter 600. Hover: coral-dark. Pressed: move down 1px.
- Secondary: transparent, 1.5px ink border, ink text.
- Ghost: text only, coral, underline on hover.
- Every button has a visible focus ring: 2px offset, `--ink`.

**Cards**
- `--paper-2` or white background, 1px `--line` border, 12px radius, 24px padding.
- Topic card: subject label (mono), title (H3), 3 concept pills, difficulty (1–3 dots), rating, "Teach this" button.

**Pills / badges**
- Mono label font, 999px radius, 4px 10px padding.
- Concept pills colored by state with an icon: ✓ understood, ~ shaky, ! gap (use lucide icons: `CheckCircle2`, `CircleDashed`, `AlertCircle`).

**Inputs**
- 48px tall, white background, 1.5px `--line` border, 12px radius. Focus: coral border.
- Labels always visible above the input, never placeholder-only.

**Chat (teach session)**
- User bubbles: right side, ink background, paper text.
- Pip bubbles: left side, white background with `--line` border, Pip avatar beside them.
- Pip's confused messages show a small highlighter-yellow "?" tag.
- Input bar fixed at the bottom: text field, mic button (round, coral when recording with a pulsing ring), send button.
- Top bar: topic name, concept progress (e.g. "4 of 7 concepts covered" with small dots), "Finish session" button.

**Countdown + seats (live sessions)**
- Big mono digits for the countdown (HH:MM:SS).
- Seat bar: 30 small squares, filled ones in ink, free ones outlined. Number below: "12 of 30 seats left".
- When booking opens, the button switches from disabled "Opens in…" to coral "Book seat".

## Key screens

**Landing page**
1. Hero: big Fraunces headline "Learn it by **teaching** it." (highlight on "teaching"), subline, coral CTA "Start teaching — free", secondary "Watch demo". Right side: Pip next to a short sample chat (3 bubbles).
2. "How it works": 3 steps in a row with numbers in mono: 01 Explain → 02 Pip gets confused → 03 See your gaps.
3. Demo: a screenshot of the Gap Report.
4. "Why teaching works": short paragraph on the protégé effect.
5. Live sessions teaser with a countdown.
6. Pricing teaser, testimonials (labelled "Demo testimonials"), footer.

**Teach session** — described above. Pip large at the top on desktop, small avatar on mobile.

**Gap report**
- Header: topic, date, score ring ("5 of 7 concepts solid").
- List of concepts with state pill, the user's quote as evidence (in a quote style with a left coral border), and a "Fix this gap" button for gaps.
- Pip summary at the bottom: "I still don't get where the oxygen comes from. Can you explain it again?"

**Understanding Map**
- Grid of topic sections; each concept is a rounded node colored by state. Hover/tap shows last evidence and date.
- Legend at the top with labels.

**Mini-lesson**
- Reading width 680px. Title, a 1-sentence "The gap" box on `--highlight` background, lesson text, one simple diagram or example box, 2 check questions with instant feedback, then "Teach Pip again".

**Leaderboard** — table with rank (mono), avatar initials, name, points, streak. Top 3 get a small coral/ink/teal ribbon. Monthly prize banner on top.

**Community** — thread list (title, topic tag, reply count, time), thread page with replies, review cards with stars.

**Pricing** — 3 cards, middle one (Pro) highlighted with a coral border and "Most popular" highlighter tag. Promo code field in checkout.

## Motion

- Durations 150–250ms, ease-out. Pip animations can loop slowly (2–3s).
- No page-wide animations, no parallax. Respect `prefers-reduced-motion`.

## Images and illustration

- No stock photos. Use Pip, simple line illustrations (1.5px ink stroke), and real UI screenshots.
- Avatars: initials in colored circles (use status/teal/coral colors).

## Checklist before a screen is done

- [ ] Only tokens from this file
- [ ] Works at 375px and 1280px
- [ ] Loading, empty, error states
- [ ] Focus states visible, contrast AA
- [ ] Copy is short and specific, no lorem ipsum
