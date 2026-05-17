# BudgetBuddy — 5 Design Concept Prompts
## Ready-to-paste prompts for Claude Design (one per concept)

Each prompt below is self-contained. Paste it directly into Claude Design along with the screenshots from `docs/design-agent-brief.md`.

---

## PROMPT 1 — BRUTALIST

```
You are a UI designer. Design two screens for BudgetBuddy, a UK personal finance app.

SCREENS TO DESIGN:
1. Web dashboard (1440×900) — main overview page, fully populated with data
2. Mobile home screen (390×844 / iPhone 15 Pro) — dashboard tab, fully populated

STYLE: BRUTALIST
Brutalist UI design — raw, confrontational, honest. Think financial newspaper meets protest poster.
No rounded corners anywhere. Heavy 3px solid black borders. No box shadows. No decorative gradients.
Typography dominates: use Space Grotesk or IBM Plex Mono for numbers, Bebas Neue / Anton for headings.
Background: warm off-white #FFFFF0 or pure white.
Accent colours: black (#000000), acid green (#00FF87), alarm red (#FF3B30), electric yellow (#FFE500).
Each stat card has a thick coloured top stripe (green=income, red=expenses, blue=cashflow, violet=savings).
Numbers are MASSIVE — 56–72px, weight 900, nearly overflowing the card. That's the feature.
Budget bars: solid coloured rectangles, no border-radius, label in all-caps above each bar.
Spending chart: stepped/angular line, area fill uses diagonal CSS hatching (45deg stripes).
Sidebar: solid black with white text. Active nav = inverted (white bg, black text). No animations.
Transaction list: plain table rows, alternating white/off-white. No card wrapper. Income green, expenses red.

DATA TO USE:
- Monthly income: £4,200 | Expenses: £2,847 | Net: +£1,353 | Savings rate: 32.2%
- Needs: £1,420/£2,100 (68%) | Wants: £891/£1,260 (71%) | Savings: £536/£840 (64%)
- Transactions: Tesco -£64.50, Netflix -£15.99, BP Fuel -£78.20, ASOS -£42.00

WEB LAYOUT:
- Left sidebar (264px, solid black) with logo [BB] and nav links
- Main area: full-width header with "DASHBOARD" in massive Bebas Neue, month nav
- 4 stat cards in a row — each a bordered box with top colour stripe
- 2-column section below: budget bars left, angular spending chart right
- Full-width transaction table at bottom

MOBILE LAYOUT:
- Black header band with "BUDGET BUDDY" in Bebas Neue white, date right-aligned
- 2×2 grid of bordered stat cards (no border-radius)
- Full-width budget section with labelled progress bars
- Transaction list as monospace table rows
- Black tab bar with yellow active indicator

Make it look like nothing else in fintech. Bold, raw, real.
```

---

## PROMPT 2 — GLASSMORPHISM / AURORA

```
You are a UI designer. Design two screens for BudgetBuddy, a UK personal finance app.

SCREENS TO DESIGN:
1. Web dashboard (1440×900) — main overview page, fully populated with data
2. Mobile home screen (390×844 / iPhone 15 Pro) — dashboard tab, fully populated

STYLE: GLASSMORPHISM / AURORA
Premium, ethereal, futuristic. Frosted glass panels floating over a deep aurora gradient.
The feeling: looking at your finances through a luxury car's heads-up display at sunset.

Background: deep dark gradient mesh — #0F0C29 base with aurora blobs:
- Blob 1: rgba(99,102,241,0.35) indigo — top-left corner, 700px soft circle
- Blob 2: rgba(16,185,129,0.25) emerald — top-right, 500px
- Blob 3: rgba(168,85,247,0.20) purple — bottom-right, 600px
Subtle noise texture overlay at 3% opacity.

Glass panels: background rgba(255,255,255,0.07), backdrop-filter blur(24px) saturate(180%),
border 1px solid rgba(255,255,255,0.13), border-radius 24px,
box-shadow 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)

Typography: Plus Jakarta Sans — white primary text, rgba(255,255,255,0.55) for labels.
Numbers: 44px, weight 700, pure white.

Sidebar: vertical glass strip, active nav items have glowing left border (4px emerald glow),
text changes to white with an emerald text-glow on active state.

Stat cards: each card has a coloured glowing orb (100px, 10% opacity) in upper corner.
Income = emerald glow. Expenses = rose glow. Cash flow = indigo glow. Savings = purple glow.
Card inner-top-left edge has a subtle highlight (1px rgba(255,255,255,0.25) chamfer).

Budget bars: track rgba(255,255,255,0.1), fill is a glowing gradient.
Needs: linear-gradient(90deg, #3b82f6, #6366f1) with drop-shadow glow.
Wants: linear-gradient(90deg, #ec4899, #f43f5e) with glow.
Savings: linear-gradient(90deg, #10b981, #34d399) with glow.

Spending chart: area chart, fill gradient from rgba(16,185,129,0.4) to transparent,
line stroke #10b981 with filter drop-shadow(0 0 8px #10b981).

DATA TO USE:
- Monthly income: £4,200 | Expenses: £2,847 | Net: +£1,353 | Savings rate: 32.2%
- Needs: £1,420/£2,100 (68%) | Wants: £891/£1,260 (71%) | Savings: £536/£840 (64%)
- Transactions: Tesco -£64.50, Netflix -£15.99, BP Fuel -£78.20, ASOS -£42.00

WEB LAYOUT:
- Glass sidebar on left (darker glass than panels)
- Main content: 4 glass stat cards in a row
- Budget glass card (left) + chart glass card (right) below
- Recent transactions in glass card with subtle dividers between rows

MOBILE LAYOUT:
- Aurora gradient bleeds full screen, behind status bar
- Top: "Good morning, Charlie" + avatar on gradient
- 2×2 glass stat cards floating over gradient
- Glass budget card below with glowing progress bars
- Frosted glass tab bar at bottom with glowing active icon
```

---

## PROMPT 3 — MINIMALIST / SWISS GRID

```
You are a UI designer. Design two screens for BudgetBuddy, a UK personal finance app.

SCREENS TO DESIGN:
1. Web dashboard (1440×900) — main overview page, fully populated with data
2. Mobile home screen (390×844 / iPhone 15 Pro) — dashboard tab, fully populated

STYLE: MINIMALIST / SWISS GRID
The "Economist" of finance apps. Calm, intelligent, editorial. Every element earns its place.
Inspired by Swiss International Typographic Style. Grid-based, type-driven, zero decoration.

Background: #FAFAFA (near-white, not blinding)
Zero shadows. Zero gradients. No icons on the main dashboard.
Panels separated only by 1px #E5E5E5 dividers or subtle background colour change to #F2F2F2.

Colour palette — ONE primary accent only:
- Ink: #0A0A0A (near-black) — headings, primary values
- Blue: #2563EB — used ONLY for the most important CTA and 1 key highlighted number
- Muted: #6B6B6B — labels, secondary info
- Divider: #E5E5E5
- Background: #FAFAFA / #F2F2F2

Typography:
- Display numbers: Editorial New (or Playfair Display) — 64px, weight 200, italic — these are the hero
- Labels: Inter 11px, uppercase, letter-spacing 0.12em
- Body: Inter 14px, weight 400
- Section headers: Inter 13px, weight 600, uppercase

Sidebar: minimal — just a 1px right border. Logo = "BB" text in a 28px square box outline.
Nav items = text only (no icons). Active = font-weight 700 + 2px left border in #0A0A0A.

Stat section: ONE full-width panel divided by 1px vertical rules (not 4 separate cards).
Each column: 11px uppercase label top, then the huge 64px weight-200 italic editorial number,
then a subtle delta indicator (↑2.1% vs last month) in small muted text below.

Budget: horizontal bar chart, no gauge. 1px grey track. Coloured fill.
Labels left-aligned, percentages right-aligned, both in 11px uppercase. No border-radius on bars.

Spending chart: single clean line, no area fill, no grid lines, just a baseline axis.
No data point dots unless hovered. Axis labels in 10px monospace.

Transactions: pure table. Merchant (left), Date (centre, grey), Amount (right, tabular-nums).
No row backgrounds. Hover state = very subtle #F5F5F5. Categories in 11px uppercase muted.

DATA TO USE:
- Monthly income: £4,200 | Expenses: £2,847 | Net: +£1,353 | Savings rate: 32.2%
- Needs: £1,420/£2,100 (68%) | Wants: £891/£1,260 (71%) | Savings: £536/£840 (64%)
- Transactions: Tesco -£64.50, Netflix -£15.99, BP Fuel -£78.20, ASOS -£42.00

WEB LAYOUT:
- Minimal left sidebar, just rules and text links
- Stat strip at top (one wide panel, 4 data columns divided by rules)
- Budget horizontal bars (left col) + minimalist line chart (right col)
- Transaction table at bottom — clean rows, no card wrapper

MOBILE LAYOUT:
- White background. 20px margins. Single typeface.
- Month in huge editorial italic (48px weight 200): "May 2026" — this is the hero
- Stats: single-column list — label + value on each row, hairline dividers between
- Budget: 3 rows (label left, thin bar middle, % right) — no card wrapper
- Transactions: clean list rows, no cards
- Tab bar: text labels only, no icons. Active = underlined with 2px rule.
```

---

## PROMPT 4 — RETRO / NEON TERMINAL

```
You are a UI designer. Design two screens for BudgetBuddy, a UK personal finance app.

SCREENS TO DESIGN:
1. Web dashboard (1440×900) — main overview page, fully populated with data
2. Mobile home screen (390×844 / iPhone 15 Pro) — dashboard tab, fully populated

STYLE: RETRO / NEON TERMINAL
Bloomberg Terminal meets cyberpunk. Hackers track their money too.
Dark, exciting, nostalgic, powerful. Command-line aesthetics meet rich data visualisation.
Dark mode only. No light mode equivalent.

Background: #050505 (near-black)
Subtle scanline texture: repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px 1px, transparent 1px 4px)
This scanline is very subtle — adds texture without distraction.

Neon colour system (one colour per data type — never mix):
- Green #00FFA3 — income, positive values
- Magenta #FF2D78 — expenses, negative values
- Cyan #00D4FF — cash flow, chart lines
- Yellow #FFE500 — savings rate, labels, category names
- White #FFFFFF — primary text

Typography: JetBrains Mono OR Fira Code (monospace only — everything, everywhere).
No serifs. No sans-serifs. The monospace IS the aesthetic.

Sidebar: #0A0A0A background. Logo = "[BB]" in green monospace with a blinking cursor "_".
Nav items: plain text. Active = "> Overview" with green ">" prefix and green text colour.
Border: 1px solid #1A1A1A right edge.

Stat cards: border 1px solid #1E1E1E with 3px NEON TOP BORDER (colour matches data type).
Background #0D0D0D. Numbers have neon text-shadow:
  text-shadow: 0 0 10px currentColor, 0 0 30px rgba(currentColor, 0.3)
Numbers: 36px monospace. Label: 11px monospace in grey #444444.
Add "● LIVE" in tiny 10px green monospace in the top header bar.

Budget bars: terminal-style. Show as: "NEEDS  [████████████░░░░]  68%"
Bar is a rectangle, no border-radius, glows in its neon colour.
Needs = cyan, Wants = magenta, Savings = green.
Label and percentage in yellow monospace.

Spending chart: neon cyan area chart. Line glows (filter: drop-shadow(0 0 4px #00D4FF)).
Area fill: gradient rgba(0,212,255,0.2) to transparent. Grid lines rgba(255,255,255,0.04).
Axis labels in 10px yellow monospace.

Transaction list: terminal output style. Each row:
  "> 2026-05-14  TESCO EXTRA          GROCERIES    -£64.50"
Date in cyan, merchant name in white (padded to fixed width with spaces), category in yellow, amount in magenta.
Font: 12px monospace. Hover: background #111111.

DATA TO USE:
- Monthly income: £4,200 | Expenses: £2,847 | Net: +£1,353 | Savings rate: 32.2%
- Needs: £1,420/£2,100 (68%) | Wants: £891/£1,260 (71%) | Savings: £536/£840 (64%)
- Transactions: Tesco -£64.50, Netflix -£15.99, BP Fuel -£78.20, ASOS -£42.00

WEB LAYOUT:
- Dark sidebar with [BB] logo and > prefixed nav
- "● LIVE DATA — MAY 2026" top bar in green monospace
- 4 neon-bordered stat cards in a row
- Terminal-progress budget bars (left) + neon chart (right) below
- Transaction terminal output at bottom

MOBILE LAYOUT:
- Pure black. Status bar area has "[BUDGET.SYS v2.1]" in green monospace
- 2×2 stat cards with neon top borders
- Budget bars as terminal progress indicators
- Transaction rows as monospace output lines
- Tab bar: black, neon coloured active icon with subtle glow, no labels
```

---

## PROMPT 5 — ORGANIC / BENTO WARMTH

```
You are a UI designer. Design two screens for BudgetBuddy, a UK personal finance app.

SCREENS TO DESIGN:
1. Web dashboard (1440×900) — main overview page, fully populated with data
2. Mobile home screen (390×844 / iPhone 15 Pro) — dashboard tab, fully populated

STYLE: ORGANIC / BENTO WARMTH
Anthropic meets Notion. Warm, tactile, friendly but data-dense. Like a tool someone
actually crafted with care — not another cold fintech dashboard.

Background: #F7F4EE (warm parchment / oat milk — not white, not beige, something in between)

Card colours — each section gets its own warm card colour (bold, not washed-out pastels):
- Income: #D4F5D6 (warm sage green)
- Expenses: #FFE5D6 (warm peach/terracotta)
- Cash flow: #D6E8FF (warm sky blue)
- Savings rate: #EDD6FF (warm lavender)
- Budget section: #FFF9D6 (warm lemon)
- Chart section: #FFFFFF (clean white for chart contrast)
- Transactions section: #F0EDE8 (warm linen)

Border radius: 28px on all cards. Consistent throughout.
Box shadow: 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04) — soft, tactile.

Typography: DM Sans or Instrument Sans — round, friendly, legible.
Numbers: 40–48px, weight 800, letter-spacing -0.02em — big and proud.
Labels: 12px, weight 500, #6B6B6B.
Section headers: 16px, weight 600.

BENTO GRID (web): non-uniform grid — the key differentiator:
- Top row: 4 stat cards BUT the most important one (Net Cash Flow or Savings Rate) is 2× wider
- This creates an asymmetric but balanced layout
- The expanded card shows a mini sparkline or a mini circular gauge

Sidebar: #1A1814 (warm dark charcoal). Logo: BudgetBuddy with a soft warm glow icon.
Nav icons displayed in small coloured pill backgrounds. Active = full-width coloured pill highlight.
Sidebar text: warm off-white #F5F0E8.

Decorative SVG icons (not Lucide — custom illustrated style, simple 2-colour):
- Income card: a small leaf or sprouting plant (growth)
- Expenses card: a small flame (burning through budget)  
- Savings card: a small jar or acorn (storing up)
- Budget section: a simple balance scale

Budget bars: 16px height, border-radius 8px, each category a warm colour.
Needs: #3B82F6. Wants: #EC4899. Savings: #10B981.
Show both the actual amount and target amount below each bar.

Spending chart: smooth bezier area chart. Fill: warm gradient rgba(16,185,129,0.15) to transparent.
Line: 2px #10B981. No grid lines. Subtle dot markers on weekly peaks.

Transactions: each row has a 4px coloured left border (category colour). Row background #FAF8F4.
Merchant name 15px weight 500. Amount bold, colour-coded. Category 11px muted below merchant.

DATA TO USE:
- Monthly income: £4,200 | Expenses: £2,847 | Net: +£1,353 | Savings rate: 32.2%
- Needs: £1,420/£2,100 (68%) | Wants: £891/£1,260 (71%) | Savings: £536/£840 (64%)
- Transactions: Tesco -£64.50, Netflix -£15.99, BP Fuel -£78.20, ASOS -£42.00

WEB LAYOUT:
- Warm dark sidebar left
- Asymmetric bento stat grid top (one card wider than others)
- Budget card (warm lemon, left) + chart card (white, right) middle
- Transaction list in warm linen card at bottom

MOBILE LAYOUT:
- Warm oat background bleeds through whole screen
- Header: "Hey, Charlie! 👋" in 28px weight 700
- 2×2 bento grid — coloured stat cards, illustrated icons, big numbers
- Budget section on warm lemon card — thick, rounded progress bars
- Transaction rows: coloured left-border, card-style with subtle shadow
- Tab bar: warm dark background, active icon in coloured pill below it
```

---

## HOW TO USE THESE PROMPTS

1. Open **Claude Design** (claude.ai with image output enabled)
2. Upload the wireframe ASCII diagrams from `docs/design-agent-brief.md` as a text attachment — or paste them inline
3. Paste one prompt block at a time
4. Request both web and mobile in one generation (they are in the same prompt)
5. Iterate on whichever concept gets closest to the vision first
6. Once happy with a concept, use the web mockup as a reference for the mobile, and vice versa

## STYLE PAIRING SUMMARY

| # | Style | Key Colour | Key Font | Key Trick |
|---|-------|-----------|---------|-----------|
| 1 | Brutalist | Black + Acid Green | Bebas Neue + IBM Plex Mono | No border-radius. Diagonal hatching. |
| 2 | Glassmorphism | Deep purple/indigo aurora | Plus Jakarta Sans | Frosted glass + aurora background blobs |
| 3 | Minimalist | Near-black + 1 blue | Editorial New + Inter | 64px weight-200 italic numbers |
| 4 | Retro Terminal | Black + neon green/cyan/magenta | JetBrains Mono (only) | Scanlines + neon glow text-shadow |
| 5 | Organic Bento | Warm oat + per-card colours | DM Sans | Asymmetric bento grid + illustrated icons |
