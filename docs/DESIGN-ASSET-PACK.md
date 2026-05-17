# BudgetBuddy — Design Agent Asset Pack
## Everything Claude Design needs to create 5 alternative UI concepts

---

## HOW TO USE THIS PACK

1. Attach **all PNG files** from `docs/screenshots/` to your Claude Design conversation
2. Paste the full contents of this document as your prompt
3. Request all 5 concepts in sequence, or ask for one at a time

---

## WHAT BUDGETBUDDY IS

**BudgetBuddy** is a UK personal finance app that turns bank CSV exports into a 50/30/20 budget dashboard. It's privacy-first — no mandatory bank sync, just upload your statement and get instant spending insights. There's a web app (Next.js) and a React Native mobile app.

**Core screens:**
- **Dashboard** — 4 stat cards (income, expenses, cash flow, savings rate) + 50/30/20 budget bars + daily spending chart + recent transactions
- **Transactions** — searchable, filterable transaction list with AI category badges
- **Budget** — detailed 50/30/20 breakdown
- **Analytics** — spending trends, monthly comparison, category breakdown
- **Import** — CSV upload flow
- **Open Banking** — Plaid-based bank connection (optional)

---

## SCREENSHOTS PROVIDED

The attached screenshots are the **real, live UI** captured with Playwright at 1440×900 (desktop), 1280×800 (laptop), 768×1024 (tablet), and 390×844 (mobile / iPhone 15 Pro), plus native iOS screenshots captured directly from the iPhone 17 Pro simulator at 402×874 logical points.

### Marketing Site
| File | What it shows |
|------|--------------|
| `01-marketing-desktop-hero.png` | Landing page hero — dark slate-950, emerald CTAs, radial gradient |
| `02-marketing-desktop-full.png` | Full marketing page — hero + features + steps + pricing + FAQ |
| `03-marketing-desktop-features.png` | Feature cards section — glassmorphism-lite cards on dark bg |
| `04-marketing-desktop-pricing.png` | Pricing section — white cards on dark bg, Free vs Pro |
| `05-marketing-mobile-hero.png` | Mobile hero — 390px viewport |
| `06-marketing-mobile-full.png` | Full mobile marketing page |

### Web Dashboard — Light Mode
| File | What it shows |
|------|--------------|
| `07-dashboard-desktop-light.png` | **PRIMARY REFERENCE** — full dashboard at 1440×900, light mode |
| `08-dashboard-stat-cards-light.png` | Closeup of the 4 stat cards row |
| `09-dashboard-budget-chart-light.png` | Budget gauge + spending chart section (scrolled) |
| `10-dashboard-transactions-light.png` | Recent transactions card (scrolled) |
| `11-dashboard-desktop-light-full.png` | Full-page scrolled light dashboard |
| `12-dashboard-laptop-light.png` | 1280px laptop viewport, light |

### Web Dashboard — Dark Mode
| File | What it shows |
|------|--------------|
| `13-dashboard-desktop-dark.png` | **PRIMARY REFERENCE** — full dashboard at 1440×900, dark mode |
| `14-dashboard-desktop-dark-full.png` | Full-page scrolled dark dashboard |

### Web Dashboard — Mobile Viewport
| File | What it shows |
|------|--------------|
| `15-dashboard-mobile-light-top.png` | Mobile 390px — header + stat cards |
| `16-dashboard-mobile-light-budget.png` | Mobile — budget section (scrolled) |
| `17-dashboard-mobile-light-transactions.png` | Mobile — transactions (scrolled) |
| `18-dashboard-mobile-light-full.png` | **PRIMARY REFERENCE** — full mobile page, light |
| `19-dashboard-mobile-dark-full.png` | Full mobile page, dark |

### Component & Detail Shots
| File | What it shows |
|------|--------------|
| `20-sign-in-desktop.png` | Clerk sign-in page — auth UI |
| `21-sign-in-mobile.png` | Mobile sign-in |
| `22-sidebar-expanded-light.png` | Sidebar only — light mode (264px wide crop) |
| `23-sidebar-expanded-dark.png` | Sidebar only — dark mode |
| `24-budget-gauge-and-chart.png` | Closeup: 50/30/20 gauge + spending area chart side by side |
| `25-dashboard-tablet-light.png` | 768px tablet viewport |
| `26-dashboard-tablet-light-full.png` | Full-page tablet scroll |

### iOS Native App — Light Mode (iPhone 17 Pro Simulator, 402×874 pts)
| File | What it shows |
|------|--------------|
| `27-ios-dashboard.png` | **PRIMARY MOBILE REFERENCE** — Dashboard tab: stat cards + 50/30/20 budget + recent transactions |
| `28-ios-transactions.png` | Transactions tab: search bar + CSV import prompt + empty state |
| `29-ios-budget.png` | Budget tab: 50/30/20 breakdown with progress bars |
| `30-ios-analytics.png` | Analytics tab: time-range selector + insight cards + monthly overview |
| `31-ios-banking.png` | Banking tab: Open Banking connection screen (Plaid) |
| `32-ios-settings.png` | Settings tab: theme toggle + export + account options |

### iOS Native App — Dark Mode
| File | What it shows |
|------|--------------|
| `33-ios-dashboard-dark.png` | **PRIMARY DARK MOBILE REFERENCE** — Dashboard in dark mode |
| `34-ios-transactions-dark.png` | Transactions tab — dark mode |
| `35-ios-budget-dark.png` | Budget tab — dark mode |
| `36-ios-analytics-dark.png` | Analytics tab — dark mode |
| `37-ios-banking-dark.png` | Banking tab — dark mode |
| `38-ios-settings-dark.png` | Settings tab — dark mode |

---

## CURRENT DESIGN ANALYSIS

Looking at the screenshots, here's an honest breakdown of the existing UI:

### What's working
- Clean information hierarchy — numbers are easy to read
- Good use of colour coding (green=income, red=expenses, blue=cashflow, violet=savings)
- Responsive layout holds up across breakpoints
- Dark mode is well-implemented
- The sidebar collapse mechanic is solid

### What's generic / weak
- **Shadcn/UI out-of-the-box feel** — indistinguishable from thousands of other dashboards
- **Soft rounded everything** — every element has the same border-radius, creating visual monotony
- **No visual identity** — nothing about the design is memorable or brand-specific
- **Stat cards all have equal weight** — net cash flow and savings rate (the most actionable numbers) don't visually dominate
- **Charts are baseline Recharts** — the area chart uses default styling with no personality
- **Mobile feels like a shrunk web app** — not designed natively for thumb navigation
- **Marketing page is a competent dark SaaS landing page** — but follows every trope (radial gradient hero, frosted feature cards, white pricing cards)

### Current design system at a glance
```
Primary:    #10b981  (emerald)
Background: #ffffff / #111827
Card:       #f9fafb / #1f2937
Border:     #e5e7eb / #374151
Income:     #10b981 emerald-600
Expenses:   #ef4444 red-600
Cashflow:   #3b82f6 blue-600
Savings:    #8b5cf6 violet-600

Font:       System UI / Inter (Tailwind default)
Radius:     rounded-xl (12px) to rounded-3xl (24px)
Shadows:    Very subtle Shadcn defaults
Components: Shadcn/UI (Card, Button, Badge, Tabs, etc.)
Icons:      Lucide React (web), Ionicons (mobile)
Charts:     Recharts (web), custom RN components (mobile)
```

---

## SAMPLE DATA (use in all mockups)

```
Monthly Income:   £4,200.00
Monthly Expenses: £2,847.00
Net Cash Flow:    +£1,353.00
Savings Rate:     32.2%

50/30/20 Budget:
  Needs:   £1,420 spent / £2,100 target  (68% — under)
  Wants:   £891 spent  / £1,260 target   (71% — under)
  Savings: £1,353 saved / £840 target    (161% — on track 🎉)

Recent Transactions:
  Tesco Extra       Groceries     -£64.50   14 May
  Netflix           Entertainment -£15.99   13 May
  BP Fuel           Transport     -£78.20   12 May
  ASOS              Shopping      -£42.00   11 May
  Salary            Income        +£4,200   1 May
```

---

## THE 5 CONCEPTS TO DESIGN

For each concept, produce:
- **1× web dashboard mockup** (1440×900) — show the main dashboard overview screen with data populated
- **1× mobile home screen mockup** (390×844, iPhone 15 Pro) — show the home tab with data populated

The web and mobile within each concept **must share the same visual language** — same palette, same typeface family, same spatial rhythm.

---

### CONCEPT 1 — BRUTALIST

**The pitch:** Raw, confrontational, honest. "Your money, unfiltered." Financial newspaper meets protest poster. Nothing is decorative. Everything is structural.

**Web — key rules:**
- Zero border-radius. Every edge is 90°.
- 3px solid black borders on all panels and cards.
- Background: `#FFFFF0` warm off-white (newsprint feel).
- Sidebar: solid `#000000`, white nav text, active = inverted white-on-black block.
- Typography: **Bebas Neue** (headings, all-caps) + **IBM Plex Mono** (numbers and data). Mix these two only.
- Stat cards: each card has a thick coloured top stripe (12px) — green/red/blue/violet per data type. Number is the hero: 64–72px, weight 900, fills the card. Almost overflowing.
- Budget bars: solid filled rectangles, no radius, label above in all-caps monospace: `NEEDS — £1,420 OF £2,100`.
- Spending chart: stepped angular area chart (not smooth), area filled with a diagonal hatching CSS pattern `repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)` at 5% opacity over the fill colour.
- Transaction list: raw `<table>` aesthetic — alternating `#FFFFFF` / `#F5F5F5` rows, no card wrapper, `border-bottom: 2px solid #000`.
- Accent colours: `#000000`, `#00FF87` acid green, `#FF3B30` alarm red, `#FFE500` electric yellow. No other colours.
- No box shadows. No gradients. No icons.

**Mobile — key rules:**
- Black status bar band. White content area.
- Header: full-width black banner — `BUDGET BUDDY` in Bebas Neue 28px white + month right-aligned in monospace.
- Stat grid: 2×2, hard black borders, no radius. Each card has a 4px coloured top border.
- Budget: all-caps labels, thick solid bars (no radius), amounts shown inside the bar in white.
- Tab bar: solid black background, icon + label in white, active = yellow `#FFE500` block highlight under icon.
- Transaction list: monospace rows, `border-bottom: 2px solid #000`, no card wrapper.

---

### CONCEPT 2 — GLASSMORPHISM / AURORA

**The pitch:** Ethereal, premium, otherworldly. Like viewing your finances through a frosted luxury glass panel at sunset. The feeling: heads-up display inside a flagship EV.

**Web — key rules:**
- Background: deep dark gradient mesh — `#0F0C29` base. Three large blurred colour orbs:
  - Indigo blob: `rgba(99,102,241,0.35)` — top-left, ~700px diameter
  - Emerald blob: `rgba(16,185,129,0.25)` — top-right, ~500px diameter
  - Purple blob: `rgba(168,85,247,0.20)` — bottom-right, ~600px diameter
  - Subtle 3% noise texture overlay.
- All panels: `background: rgba(255,255,255,0.07)`, `backdrop-filter: blur(24px) saturate(180%)`, `border: 1px solid rgba(255,255,255,0.13)`, `border-radius: 24px`, `box-shadow: 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)`.
- Typography: **Plus Jakarta Sans** — white primary, `rgba(255,255,255,0.55)` muted.
- Numbers: 44px weight 700, pure white.
- Sidebar: slightly darker glass (`rgba(255,255,255,0.05)`). Active nav: glowing emerald left border `box-shadow: inset 4px 0 0 #10b981` + `background: rgba(16,185,129,0.12)`. Icon glows on active.
- Stat cards: each has a soft glowing colour orb (80px, 12% opacity) in the upper corner matching its type. Income = emerald, Expenses = rose, Cashflow = indigo, Savings = purple.
- Budget bars: track `rgba(255,255,255,0.1)`, fill uses gradient with glow. Needs: `#3b82f6→#6366f1`. Wants: `#ec4899→#f43f5e`. Savings: `#10b981→#34d399`.
- Spending chart: area gradient from `rgba(16,185,129,0.35)` to transparent. Line glows: `filter: drop-shadow(0 0 6px #10b981)`.
- Transaction rows: glass micro-card per row, subtle divider `rgba(255,255,255,0.08)`.

**Mobile — key rules:**
- Aurora gradient bleeds edge-to-edge, behind status bar. Full immersion.
- Header: "Good morning, Charlie" in 20px weight 600 white + circular avatar top-right.
- Stat cards: 2×2 grid of glass cards floating over the gradient. Each has a coloured orb.
- Budget: glass card with glowing progress bars.
- Tab bar: glass panel bottom, frosted. Active icon glows in its accent colour.

---

### CONCEPT 3 — MINIMALIST / SWISS GRID

**The pitch:** The Economist of finance apps. Calm, intelligent, restrained. Inspired by Swiss International Typographic Style — grid-driven, type-first, zero decoration. Every element earns its place or it's removed.

**Web — key rules:**
- Background: `#FAFAFA`.
- Zero shadows. Zero gradients. Zero icons on the main dashboard.
- Panels separated only by `1px solid #E5E5E5` dividers or `#F2F2F2` background shift.
- Two-colour palette only: `#0A0A0A` (ink) + `#2563EB` (used exclusively for the primary CTA and the single most important number on screen).
- Typography: **Editorial New** (or Playfair Display) italic for display numbers + **Inter** for everything else. Display numbers: 64px, weight 200, italic. Labels: Inter 11px uppercase letter-spaced 0.12em.
- Stat row: ONE full-width panel with `1px` vertical rule dividers between columns. No separate cards. Each column: 11px uppercase label → 64px editorial number → small delta indicator.
- Budget: horizontal bar only. 1px grey track. Coloured fill. No border-radius on bars. Labels left-aligned, percentages right-aligned. No card background.
- Spending chart: single clean line only, no fill, no grid lines, just a hairline baseline. No dot markers.
- Transactions: pure table — merchant left (weight 500), date centre (grey), amount right (tabular-nums). No row backgrounds; hover = `#F5F5F5`.
- No icons anywhere on the dashboard. Information is the decoration.

**Mobile — key rules:**
- White background. Single typeface. 20px minimum margins.
- Header: current month in 48px Editorial New italic weight 200 — this is the hero. Small "OVERVIEW" label 11px above it.
- Stats: single-column list — label + value on each row, separated by hairline dividers. No cards, no backgrounds, no icons.
- Budget: 3 rows — name left, thin bar middle, % right. No card wrapper.
- Transactions: clean list rows. No card wrappers.
- Tab bar: text-only labels (no icons). Active tab underlined with a 2px `#0A0A0A` rule.

---

### CONCEPT 4 — RETRO / NEON TERMINAL

**The pitch:** Bloomberg Terminal meets cyberpunk. Hackers track their money too. Dark, exciting, nostalgic, powerful. Monospace everything. The screen glows.

**Web — key rules:**
- Background: `#050505` with a very subtle scanline texture: `repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px 1px, transparent 1px 4px)`.
- Typography: **JetBrains Mono** or **Fira Code** — monospace throughout. Everything. No exceptions.
- Neon colour system (one colour per data type, never mixed):
  - Income/positive: `#00FFA3` neon mint-green
  - Expenses/negative: `#FF2D78` hot pink/magenta
  - Cash flow/chart: `#00D4FF` electric cyan
  - Savings rate/labels: `#FFE500` electric yellow
  - Primary text: `#FFFFFF`
- Neon glow formula: `text-shadow: 0 0 10px currentColor, 0 0 30px color-mix(in srgb, currentColor 30%, transparent)`.
- Sidebar: `#0A0A0A` bg, `border-right: 1px solid #1A1A1A`. Logo: `[BB]_` in neon green with blinking cursor. Nav: plain monospace text, active = `> Overview` with green `>` prefix.
- Stat cards: `border: 1px solid #1E1E1E`, 3px NEON TOP BORDER only (colour per type), `background: #0D0D0D`. Numbers glow.
- Budget bars: terminal progress indicators — `NEEDS  [████████████░░░░]  68%`. Solid rectangles, no radius, glow in their neon colour.
- Spending chart: neon cyan line glows. Area fill `rgba(0,212,255,0.15)` to transparent. Grid lines `rgba(255,255,255,0.04)`. Axis in 10px yellow monospace.
- Transactions: terminal output — each row: `> DATE  MERCHANT          CATEGORY   AMOUNT`. Date=cyan, merchant=white, category=yellow, amount=green/magenta.
- "● LIVE DATA" in 10px green monospace in the header bar.

**Mobile — key rules:**
- Pure `#050505` background. No light mode.
- Top band: `[BUDGET.SYS v2.1]` in 12px green monospace + date in yellow monospace.
- Stats: 2×2 cards with 3px neon top borders, numbers glow.
- Budget: terminal-progress-bar style per category, different neon each.
- Tab bar: `#0A0A0A`, active icon glows in neon, no labels.
- Transaction rows: 12px monospace, padded to column-alignment.

---

### CONCEPT 5 — ORGANIC / BENTO WARMTH

**The pitch:** Anthropic meets Notion. Warm, tactile, human. Like a tool someone crafted with genuine care — not a spreadsheet. The numbers are big and proud. The colours are real, not washed out.

**Web — key rules:**
- Background: `#F7F4EE` (warm parchment/oat — not white, not beige).
- Each section has its own warm card colour (these are bold, saturated, not pastel):
  - Income card: `#D4F5D6` warm sage green
  - Expenses card: `#FFE5D6` warm peach/terracotta
  - Cash flow card: `#D6E8FF` warm sky blue
  - Savings rate card: `#EDD6FF` warm lavender
  - Budget section: `#FFF9D6` warm lemon
  - Chart section: `#FFFFFF` clean white (for chart contrast)
  - Transactions: `#F0EDE8` warm linen
- Border radius: `28px` everywhere. Consistent.
- Shadow: `0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)`.
- Typography: **DM Sans** or **Instrument Sans** — round, friendly, legible. Numbers: 40–48px, weight 800, `letter-spacing: -0.02em`. Labels: 12px weight 500.
- **BENTO GRID** — non-uniform layout. The key differentiator: the most important stat (Net Cash Flow) gets a 2× wide card, creating an asymmetric but balanced first row. The other 3 stats are standard width.
- Sidebar: `#1A1814` warm dark charcoal. Nav items have small coloured icon pills. Active = full-width warm colour highlight pill.
- Budget bars: 16px height, `border-radius: 8px` (thick and rounded, tactile like a slider). Show both actual amount and target below each bar.
- Spending chart: smooth bezier area, warm gradient fill `rgba(16,185,129,0.15)` to transparent. 2px emerald line. No grid lines. Subtle weekly peak markers.
- Each transaction row: 4px coloured left border (category colour). Row bg `#FAF8F4`. Merchant 15px weight 500. Amount bold colour-coded. Category 11px muted below.
- Decorative SVG icons (simple 2-colour illustration style, not Lucide):
  - Income card: a small sprouting leaf
  - Expenses card: a small flame
  - Savings card: a small jar or acorn
  - Budget section header: a small set of scales

**Mobile — key rules:**
- `#F7F4EE` oat background, edge-to-edge.
- Header: "Hey, Charlie! 👋" in 28px weight 700. Personalised, warm.
- Stats: 2×2 bento grid — each card in its warm colour, illustrated icon (40px), bold number. `border-radius: 20px`.
- Budget: warm lemon card `#FFF9D6`, thick rounded progress bars.
- Transaction rows: coloured left border (4px), each row is a mini card with soft shadow.
- Tab bar: `#1A1814` dark charcoal, active icon in small coloured pill indicator beneath it. Chunky icons.

---

## WHAT MAKES THESE GREAT — DESIGN PRINCIPLES

1. **Instant personality** — within 2 seconds the user knows what kind of product this is and feels something about it
2. **The important number wins** — savings rate or net cash flow must visually dominate the layout
3. **One memorable detail per concept** — the hatching pattern (Brutalist), the aurora orbs (Glass), the 64px italic editorial number (Minimal), the blinking cursor (Terminal), the asymmetric bento grid (Bento)
4. **Mobile ≠ shrunken web** — the mobile mockup should feel native, not like the web app squished to 390px
5. **Web–mobile coherence** — someone should be able to look at the pair and immediately know it's the same product

---

## STYLE SUMMARY TABLE

| # | Style | Background | Accent | Font | Radius | Signature |
|---|-------|-----------|--------|------|--------|-----------|
| 1 | **Brutalist** | `#FFFFF0` warm off-white | Acid green `#00FF87` | Bebas Neue + IBM Plex Mono | 0px | Diagonal hatching, 72px numbers |
| 2 | **Glassmorphism** | Aurora `#0F0C29` + orbs | Emerald + indigo glow | Plus Jakarta Sans | 24px | Frosted panels, glowing fills |
| 3 | **Minimalist** | `#FAFAFA` | `#0A0A0A` + 1 blue | Editorial New italic + Inter | 0px | 64px weight-200 italic numbers |
| 4 | **Retro Terminal** | `#050505` + scanlines | Neon: green/cyan/magenta/yellow | JetBrains Mono only | 0px | `[████░░]` bars, neon glow |
| 5 | **Organic Bento** | `#F7F4EE` oat | Per-card warm colours | DM Sans | 28px | Asymmetric bento, illustrated icons |

---

## REFERENCE: WEB LAYOUT STRUCTURE

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR 264px        │  MAIN CONTENT (flex-1)                   │
│ ─────────────────── │ ─────────────────────────────────────────  │
│ [BB] BudgetBuddy  ◁  │  HEADER: "Overview" | theme | bell | ava │
│                      │ ─────────────────────────────────────────  │
│ ● Overview           │  "Dashboard"              < May 2026 >    │
│   Transactions       │  "Your financial overview at a glance"    │
│   Budget             │                                           │
│   Analytics          │  ┌ Income ┐ ┌ Expenses ┐ ┌ CFlow ┐ ┌ S% ┐│
│   Import             │  │ £4,200 │ │ £2,847   │ │+£1,353│ │32.2%││
│   Open Banking       │  └────────┘ └──────────┘ └───────┘ └────┘│
│                      │                                           │
│   ─────────────      │  ┌ Insight: "Great Savings Rate! 32.2%" ┐ │
│   Settings           │  └───────────────────────────────────────┘│
│                      │                                           │
│                      │  ┌── 50/30/20 Budget ──┐ ┌─ Daily Spend─┐│
│                      │  │ 32.2% saved         │ │  area chart  ││
│                      │  │ Needs  ████████░  68%│ │   📈        ││
│                      │  │ Wants  ████████░  71%│ │             ││
│                      │  │ Savings████████░ 161%│ │             ││
│                      │  │ £4,200  │  £2,847    │ │             ││
│                      │  └─────────────────────┘ └─────────────┘│
│                      │                                           │
│                      │  ┌─── Recent Transactions ──── View All─┐ │
│                      │  │ T  Tesco Extra   Groceries  -£64.50  │ │
│                      │  │ N  Netflix       Entertain  -£15.99  │ │
│                      │  │ B  BP Fuel       Transport  -£78.20  │ │
│                      │  │ A  ASOS          Shopping   -£42.00  │ │
│                      │  │ S  Salary        Income    +£4,200   │ │
│                      │  └──────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## REFERENCE: MOBILE LAYOUT STRUCTURE

```
┌──────────────────────┐
│ [status bar]         │
│ ───────────────────  │
│ Overview      ☀ 🔔 C │ ← header
│ ───────────────────  │
│ Dashboard            │
│ Your financial...    │
│                      │
│ < May 2026 >         │
│                      │
│ ┌──────┐  ┌──────┐   │
│ │ Inc  │  │ Exp  │   │ ← 2×2 stat cards
│ │£4,200│  │£2,847│   │
│ └──────┘  └──────┘   │
│ ┌──────┐  ┌──────┐   │
│ │ Net  │  │ Rate │   │
│ │+1,353│  │32.2% │   │
│ └──────┘  └──────┘   │
│                      │
│ ┌ 50/30/20 Budget ─┐ │ ← budget section card
│ │ Needs  ████████░ │ │
│ │ £1,420 / £2,100  │ │
│ │ Wants  ████████░ │ │
│ │ £891 / £1,260    │ │
│ │ Savings████████░ │ │
│ │ £1,353 / £840    │ │
│ └──────────────────┘ │
│                      │
│ ┌ Recent Txns ─────┐ │ ← transactions card
│ │ 🔴 Tesco  -£64.50│ │
│ │ 🔴 Netflix -£15.99│ │
│ │ 🟢 Salary +£4,200│ │
│ └──────────────────┘ │
│ ───────────────────  │
│ 🏠  🧾  📊  📈  🏦  ⚙️ │ ← 6-tab bar
│ Dash Tx  Bgt Ana Bank Set│
└──────────────────────┘
```

---

*Asset pack generated from live Playwright screenshots of the running BudgetBuddy app + native iOS screenshots from the iPhone 17 Pro simulator.*
*Screenshots: 38 PNGs in `docs/screenshots/` — 26 web/marketing + 12 iOS native (6 light + 6 dark). Brief: this document.*
*Tech stack: Next.js 15, Tailwind CSS, Shadcn/UI, Recharts (web) · Expo Router / React Native, Ionicons (mobile)*
