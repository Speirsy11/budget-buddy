# BudgetBuddy — Design Agent Brief
## 5 Alternative UI Concepts: Web + Mobile

---

## MISSION

Design **5 alternative UI concepts** for the BudgetBuddy finance app, covering both **web dashboard** and **React Native mobile**. Each concept must be visually striking, emotionally engaging, and distinct from the current design. The web and mobile concepts within each pair must share the same visual language (colour palette, typography, spatial rhythm) so they feel like one cohesive product.

**Deliverables:** For each of the 5 styles, produce:
- 1× web dashboard mockup (1440×900, key screen = main dashboard overview)
- 1× mobile home screen mockup (390×844, iPhone 15 Pro size)

---

## EXISTING UI — CURRENT STATE ANALYSIS

### What the app currently looks like

**Tech stack context:** Next.js 15, Tailwind CSS, Shadcn/UI components, React Native (Expo) for mobile.

**Current design character:** Professional, safe, functional — but generic. The kind of dashboard every SaaS ships. It does not differentiate itself visually. Users won't remember the aesthetic after closing the tab.

---

### Web App — Current Design

**Layout:**
- Fixed left sidebar (264px expanded, collapses to 72px icon-only)
- Sidebar contains: BudgetBuddy logo (blue→indigo gradient square + Smile icon) + nav links (Overview, Transactions, Budget, Analytics, Import, Open Banking, Settings)
- Main content area uses standard card grid layout
- Top header area: page title + month navigation (prev/next arrows with month name)

**Dashboard main page sections (top → bottom):**
1. **Header row** — "Dashboard" h2 + "Your financial overview at a glance" subtitle, left-aligned. Month navigation (ChevronLeft | "May 2026" | ChevronRight) right-aligned.
2. **4-stat card row** — `sm:grid-cols-2 lg:grid-cols-4`, each card has:
   - Decorative circle blob (top-right corner, 24×24, low opacity coloured circle)
   - Small coloured icon in a pill
   - Label in muted colour
   - Large bold number (colour-coded: green for income, red for expenses, blue/red for cash flow, neutral for savings rate)
   - Cards: Total Income (emerald), Total Expenses (red), Net Cash Flow (blue/red), Savings Rate (violet progress bar)
3. **Insight cards** — contextual callouts (warning/positive/tip) in a responsive grid
4. **2-column grid**: Budget Gauge (50/30/20 progress bars) + Daily Spending chart (line chart)
5. **Recent Transactions** — full-width card, list of transaction rows with merchant, category chip, amount, date. "View All" link top-right.

**Typography:**
- Heading: `text-2xl font-bold tracking-tight` — Inter/system-ui
- Card labels: `text-sm font-medium text-muted-foreground`
- Numbers: `text-2xl font-bold` with colour coding
- Body/descriptions: `text-sm text-muted-foreground`

**Colour system:**
- Primary: `#10b981` (emerald-500) — used for active states, CTAs
- Background: `white` (light mode) / `#111827` (dark mode)
- Card: `bg-card` = `#ffffff` light / `#1f2937` dark
- Border: subtle `#e5e7eb` / `#374151`
- Accents: emerald (#10b981), blue (#3b82f6), violet (#8b5cf6), red (#ef4444)
- Sidebar: `bg-card` with `border-r`
- All income numbers: `text-emerald-600`
- All expense numbers: `text-red-600`

**Spacing/radius:**
- Cards: `rounded-xl` (12px) to `rounded-3xl` (24px)
- Buttons: `rounded-lg`
- Gaps: `gap-4` to `gap-6`
- Padding: `p-6` cards, `px-3 py-4` sidebar nav

**Marketing page (separate):**
- Dark hero: `bg-slate-950` base, `text-white`
- Radial gradient overlay: blue-600 (top-left) + emerald-500 (top-right)
- CTA buttons: `bg-emerald-400 text-slate-950` (primary), outline ghost (secondary)
- Feature cards: `rounded-3xl border border-white/10 bg-white/[0.04]` — subtle glassmorphism
- Pricing cards: white on dark background
- Badge: `rounded-full border border-emerald-300/20 bg-emerald-300/10`

---

### Mobile App — Current Design

**Framework:** Expo Router + React Native, Ionicons for icons

**Navigation:** Bottom tab bar with 5–6 tabs:
- Home (house icon)
- Transactions (receipt icon)
- Budget (pie-chart icon)
- Analytics (trending-up icon)
- Banking (business icon)
- Settings (gear icon)

Tab bar style: `backgroundColor: colors.card`, `borderTopColor: colors.border`, active tint = `#10b981` (emerald)

**Dashboard screen (top → bottom, ScrollView):**
1. **Header** — "Welcome back" (small muted text) + "Your Finance Overview" (24px bold)
2. **Stats Grid** — `flexDirection: row, flexWrap: wrap, gap: 12` — 2×2 grid of StatCards
   - Each StatCard: coloured icon in a translucent pill, label text (13px muted), value text (18px bold 700)
   - Cards: Income (green), Expenses (red), Savings (emerald), Savings Rate (purple)
3. **50/30/20 Budget section** — rounded card `borderRadius: 16`, section header + "See Details" link, 3× BudgetProgress bars (Needs/blue, Wants/pink, Savings/emerald) each with label, amounts, percentage fill bar
4. **Recent Transactions** — rounded card, section header + "See All" link, list of TransactionItems

**Light mode colours:** `background: #ffffff, card: #f9fafb, text: #111827, textMuted: #6b7280, border: #e5e7eb, primary: #10b981`
**Dark mode colours:** `background: #111827, card: #1f2937, text: #f9fafb, textMuted: #9ca3af, border: #374151, primary: #10b981`

**Spacing/radius:** Cards `borderRadius: 16`, icon pills `borderRadius: 10`, section padding 16px, list item gaps 8px

---

## CURRENT UI — PROBLEMS TO SOLVE

1. **Generic SaaS look** — indistinguishable from thousands of other dashboards built with Shadcn
2. **No emotional pull** — the dashboard doesn't excite or delight; it just reports numbers
3. **Weak visual hierarchy** — the 4 stat cards all compete equally; the key insight is lost
4. **Low information density on mobile** — the stat grid feels underpowered; lots of empty white space
5. **Brand amnesia** — nothing about the visual identity sticks in memory
6. **Safe rounded corners everywhere** — all elements blur together into a soft, forgettable soup

---

## THE 5 UI CONCEPTS

Each concept below describes what the redesign should look, feel, and communicate. Design these as pixel-perfect mockups showing the **main dashboard state** (populated with data — don't show empty states).

Use these sample data values for consistency:
- Monthly income: **£4,200**
- Monthly expenses: **£2,847**
- Net cash flow: **+£1,353**
- Savings rate: **32.2%**
- Needs: £1,420 / £2,100 (68%)
- Wants: £891 / £1,260 (71%)
- Savings: £536 / £840 (64%)
- Top transactions: Tesco £64.50, Netflix £15.99, BP Fuel £78.20, ASOS £42.00, Costa £3.80

---

### CONCEPT 1 — BRUTALIST

**Web codename:** `BB-BRUT-WEB`
**Mobile codename:** `BB-BRUT-MOB`

**Mood:** Raw. Confrontational. Honest. "Your money, unfiltered." Like a financial newspaper crossed with a protest poster.

**Web dashboard:**
- Background: `#FFFFF0` (warm off-white / paper) or pure `#FFFFFF`
- All cards and panels: **no rounded corners** (`border-radius: 0`), heavy `3px solid #000000` borders
- Sidebar: Full-height solid black (`#000000`) sidebar with white text. Active item = inverted (white bg, black text). No hover animations — just instant state change.
- Typography: **Space Grotesk** or **IBM Plex Mono** for numbers; **Bebas Neue** or **Anton** for headings; all caps headings
- Stat cards: each card is a stark bordered box. Income card top stripe is thick block of `#00FF87` (acid green). Expenses card = `#FF3B30` stripe. No icons — just the raw number in massive `font-size: 56px font-weight: 900` type that almost overflows the card
- Budget gauge: horizontal bars rendered as solid coloured blocks. No percentage — show absolute numbers in brutalist label above each bar: `NEEDS — £1,420 OF £2,100`
- Spending chart: area chart but with angular stepped lines, not smooth curves. Fill with diagonal hatching pattern (`repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)`)
- Recent transactions: plain table rows, no card wrapper. Alternating white/`#f5f5f5` rows. Amounts in red if expense, green if income
- Accent colours: black, white, `#00FF87` (acid green), `#FF3B30` (alarm red), `#FFE500` (warning yellow)
- No box shadows. No gradients. No decorative blobs.

**Mobile:**
- Black status bar area
- Full-width black header band: `BUDGET BUDDY` in Bebas Neue 32px white, left-aligned. Month selector = `< MAY 2026 >` right-aligned in monospace
- Stat grid: 2×2 grid but each card has a thick border and no border-radius. Top-left corner of each card has a bold coloured tag indicating type
- Budget section: section label in ALL CAPS with thick black underline. Each bar is a thick rectangle — no border-radius. Label above, amount inside the bar in white
- Tab bar: black background, icon + label in white, active = yellow rectangle highlight
- Transaction list: raw table with `border-bottom: 2px solid #000`

---

### CONCEPT 2 — GLASSMORPHISM / AURORA

**Web codename:** `BB-GLASS-WEB`
**Mobile codename:** `BB-GLASS-MOB`

**Mood:** Ethereal. Premium. Futuristic wealth. Like looking at your finances through a frosted window at sunset.

**Web dashboard:**
- Background: deep gradient mesh — `radial-gradient` combining `#0F0C29 → #302B63 → #24243e` (deep purple-black) with animated aurora blobs: blob1 `rgba(99,102,241,0.35)` (indigo), blob2 `rgba(16,185,129,0.25)` (emerald), blob3 `rgba(168,85,247,0.2)` (purple). Blobs are 600–800px soft circles in corners.
- All panels/cards: `background: rgba(255,255,255,0.06)`, `backdrop-filter: blur(24px) saturate(180%)`, `border: 1px solid rgba(255,255,255,0.12)`, `border-radius: 24px`, subtle `box-shadow: 0 8px 32px rgba(0,0,0,0.3)`
- Sidebar: vertical strip of glass, slightly lighter (`rgba(255,255,255,0.08)`). Logo glows — icon has a soft emerald luminous halo. Active nav items have a glowing left-border `box-shadow: inset 4px 0 0 #10b981, background: rgba(16,185,129,0.12)`
- Typography: **Plus Jakarta Sans** — white primary text, `rgba(255,255,255,0.55)` muted text
- Stat cards: inner glow on top/left edges. Numbers in luminous white. Each card has a coloured glowing orb (10% opacity, 80px) in the corner corresponding to its type. Income = emerald glow, Expenses = rose glow, Cash flow = indigo glow, Savings = purple glow
- Budget bars: translucent track `rgba(255,255,255,0.1)`, glowing fill using gradient (`from-color to-color/80`), slight bloom effect on the fill
- Spending chart: area chart with gradient fill from solid line to transparent. Line itself glows with the emerald colour (`filter: drop-shadow(0 0 6px #10b981)`)
- No hard shadows — everything uses ambient glow and blur

**Mobile:**
- Full-screen aurora gradient background — bleeds behind the status bar
- Header: first name greeting + avatar in top corners over the gradient
- Stat grid: 2×2 glass cards floating over the gradient
- Budget section: glass card with glowing progress bars
- Tab bar: glass panel, frosted, active icon glows
- Micro-animation: on load, glass panels fade in with a 300ms blur-in effect

---

### CONCEPT 3 — MINIMALIST / SWISS GRID

**Web codename:** `BB-MONO-WEB`
**Mobile codename:** `BB-MONO-MOB`

**Mood:** Calm. Intelligent. "The Economist" of finance apps. Nothing is decoration. Every element earns its place.

**Web dashboard:**
- Background: `#FAFAFA` (near-white, not blinding white)
- Single accent colour: `#0A0A0A` (near-black) — used for everything important. One secondary accent allowed: `#2563EB` (strong blue) — used only for primary CTAs and one key data highlight (the biggest number on screen)
- Grid: strict 12-column grid. Sidebar is 2 columns. Content is 10 columns. Max content width 1200px.
- Sidebar: minimal vertical rule `1px solid #E5E5E5` only. Logo is text-only: `BB` in a small box. Nav links are just text — no icons in expanded state. Active = bold weight + left `2px solid #0A0A0A` indicator
- No card shadows at all. Panels are separated by `1px solid #E5E5E5` dividers or background colour change to `#F0F0F0`
- Typography: **Editorial New** (or Playfair Display) for display numbers; **Inter** for body. Key metric numbers: 64px, weight 200 (ultra-light italic for impact). Labels: 11px uppercase letter-spaced
- Stat row: instead of 4 separate cards, one full-width panel divided by thin `1px` vertical rules. Each column: label at top in 10px uppercase, huge number in editorial type, small change indicator below
- Budget: horizontal bar chart only — no gauge. Clean single-pixel track. Labels on left, percentages on right, aligned to a grid
- Spending chart: clean line chart, no area fill, no grid lines (just faint `x-axis` baseline), no dot markers
- Recent transactions: table with `font-variant-numeric: tabular-nums`. Merchant left, amount right, date centre. No row backgrounds — just hover state `background: #F5F5F5`
- No icons anywhere on the dashboard. Information only.

**Mobile:**
- White background. Single typeface. Generous margins (20px minimum)
- Header: current month in large editorial type (48px weight-200 italic), "Overview" label in 11px uppercase above it
- Stats: single-column list instead of grid — each stat is just label + number on one row, separated by hairline dividers. No cards, no backgrounds.
- Budget: three-row progress section. Each row: category name left-aligned, thin bar spanning 70% of width, percentage right-aligned
- Tab bar: text-only tabs (no icons). Active tab underlined with a 2px rule.
- Transactions: clean list — merchant name (medium weight) + date (light, right-aligned) on top row; amount (bold, emerald for income, red for expense) + category (small muted) on second row

---

### CONCEPT 4 — RETRO / NEON TERMINAL

**Web codename:** `BB-RETRO-WEB`
**Mobile codename:** `BB-RETRO-MOB`

**Mood:** Hackers track their money too. Command-line aesthetics meet rich data visualisation. Dark, exciting, nostalgic, powerful — like Bloomberg Terminal meets cyberpunk.

**Web dashboard:**
- Background: `#0A0A0A` or `#050505` (near-black)
- Subtle scanline texture overlay: `repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px)`
- Neon accent palette: `#00FFA3` (neon green/mint), `#FF2D78` (hot pink/magenta), `#00D4FF` (electric cyan), `#FFE500` (electric yellow). Use each colour for a different data type — never mix on same element.
- Typography: **JetBrains Mono** or **Fira Code** (monospace) throughout. All text is monospace. No serifs, no sans-serifs.
- Sidebar: `background: #0F0F0F`, `border-right: 1px solid #1A1A1A`. Logo: `[BB]` in neon green with a blinking cursor `_`. Nav items prefixed with `>` when active. Active item: neon green text, no background change — just the colour and a green `>` prefix.
- Stat cards: `border: 1px solid #1E1E1E` with neon colour top-border only (3px). Card background `#0F0F0F`. Numbers render with a neon text-shadow: `text-shadow: 0 0 12px currentColor, 0 0 40px currentColor/30`. Numbers displayed as raw values with a `£` prefix in smaller monospace.
- Budget bars: terminal-style ASCII-inspired progress `[███████░░░]` — rendered with actual CSS but designed to look like a terminal progress indicator. Each bar glows in its neon colour.
- Spending chart: filled area chart with a neon line (`stroke: #00FFA3`) that glows. Grid lines are subtle `rgba(255,255,255,0.05)`. Y-axis values in monospace.
- Transaction list: terminal output style — each line is a row with `>` prefix. Date in cyan, merchant in white, amount in green (income) or magenta (expense), category in yellow. Font: 13px monospace.
- Add subtle "LIVE" indicator in the header (blinking green dot) — `● LIVE DATA` in 11px monospace
- Occasional glitch animation (CSS keyframe) on stat numbers — quick horizontal distortion on hover

**Mobile:**
- Pure black background. No light mode.
- Status bar: custom dark. Top: `[BUDGET.SYS]` label in green monospace, date in yellow monospace — like a computer boot screen.
- Stats: full-width cards with neon top border. Numbers glow. Layout is 2×2 but with hard borders.
- Budget section: ASCII-progress-bar style — label + `[███████░░░]` + percentage. Each category a different neon.
- Tab bar: black, neon-coloured active icon with glow effect. No labels — just the icons.
- Transaction rows: monospace font, merchant truncated to fixed chars, amount right-aligned with sign character `+/-`

---

### CONCEPT 5 — ORGANIC / BENTO WARMTH

**Web codename:** `BB-BENTO-WEB`
**Mobile codename:** `BB-BENTO-MOB`

**Mood:** Friendly. Tangible. "Anthropic meets Notion." Like someone actually thought about where you'd look first and made it feel like a warm, tactile tool — not a spreadsheet.

**Web dashboard:**
- Background: `#F7F4EE` (warm parchment / oat milk) — not cold white
- Card colours: each card in the bento grid is a different warm colour. Not pastel — bolder and more saturated than typical "friendly" dashboards:
  - Income card: `#D4F5D6` (warm sage green)
  - Expenses card: `#FFE5D6` (warm peach/terracotta)
  - Cash flow card: `#D6E8FF` (warm sky blue)
  - Savings card: `#EDD6FF` (warm lavender)
  - Budget section: `#FFF9D6` (warm lemon)
  - Chart card: `#FFFFFF` clean white for contrast
- **Bento grid layout:** non-uniform grid. Stat cards are different sizes — the "most important" stat (Net Cash Flow or Savings Rate) gets a 2× wide card. The grid is visually playful but still data-dense.
- Border radius: `border-radius: 28px` — extra round, but consistent. Cards have soft `box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)`
- Sidebar: `background: #1A1814` (warm dark charcoal). Logo: the Smile icon with a warm glow. Nav items: icons in coloured mini-chips. Active = full-width warm coloured highlight bar
- Typography: **Instrument Sans** or **DM Sans** — round, friendly, highly legible. Headings in `font-weight: 600`, numbers in `font-weight: 800`. Slightly more line height than usual.
- Numbers are large and proud — `font-size: 40px font-weight: 800 letter-spacing: -0.02em`
- Budget bars: thick (`height: 16px`), full `border-radius: 8px`, each category a warm colour
- Chart: area chart with a warm fill gradient (not cold blue). Rounded line (smooth bezier), no grid lines, just subtle dotted `y-axis` on hover
- Decorative touches: small emoji-style icons in cards (can be SVG illustrations, not Lucide icons). Example: a tiny leaf in the savings card, a flame in the expenses card.
- Transaction list: each transaction row has a category colour dot (10px circle, bold colour). Merchant name is the main focal point in 15px medium weight.

**Mobile:**
- Background: warm oat `#F7F4EE`
- Header: large friendly greeting — "Hey, Charlie!" in `font-size: 28px font-weight: 700` with a wave emoji or small SVG character
- Stats: 2×2 bento grid of colour-coded cards. Each card has a large icon (40px, SVG illustration style) and the value in bold. Cards have strong border radius (20px).
- Budget section: coloured card in lemon yellow. Progress bars are thick and rounded — look tactile like sliders.
- Tab bar: warm dark `#1A1814` background. Active icon gets a coloured pill indicator beneath it. Icons are chunky, outlined style.
- Transaction rows: category colour coded left border (4px) on each row. Card-style with a tiny shadow.

---

## WHAT MAKES A GREAT DESIGN HERE

The designer should aim for:

1. **Instant personality** — within 2 seconds of looking at the design, the user knows what kind of product this is and feels something
2. **Hierarchy** — the most important number (savings rate or net cash flow) must visually dominate
3. **Data density with clarity** — show more information than the current design without feeling cluttered
4. **Memorable detail** — one or two specific details that make each concept stick (the hatching pattern in Brutalist, the neon glow in Terminal, the warm emoji in Bento)
5. **Mobile-web coherence** — the two screens within each concept should feel like the same product on different canvases

---

## SCREENS TO DESIGN (each concept)

### Web (1440×900 viewport)
Show the main dashboard overview page in a **populated state** (with data as specified above). Include:
- The sidebar in its expanded state
- The full stat card row
- The budget section (left column)
- A visible portion of the spending chart (right column)
- The top 3 transactions in the Recent Transactions list
- The page header with the month navigator

### Mobile (390×844 — iPhone 15 Pro)
Show the Home/Dashboard tab in a **populated state**. Include:
- Status bar area (use system safe area)
- Header greeting
- Full 2×2 stat card grid
- The budget progress section (all 3 bars)
- At least 2–3 recent transactions
- The bottom tab bar

---

## TECHNICAL CONSTRAINTS FOR IMPLEMENTATION

These designs will eventually be coded into:
- **Web:** Next.js 15, Tailwind CSS, Shadcn/UI, Recharts (for charts), Lucide icons
- **Mobile:** React Native (Expo), StyleSheet API, Ionicons, custom components

So please design with these technical realities in mind:
- Avoid effects that are impossible or very expensive to implement in CSS/React Native (eg. complex particle systems, canvas-heavy animations)
- Glassmorphism/blur is achievable: `backdrop-filter: blur()` on web, `BlurView` on mobile
- Custom fonts are easy to add
- Animations should be simple (CSS transitions / Animated API)
- SVG illustrations for decorative elements are achievable
- Avoid relying on video backgrounds

---

## REFERENCE VISUAL LANGUAGE (existing brand colours)

```
Emerald: #10b981 (primary)
Blue:    #3b82f6 (needs)
Rose/Red: #ef4444 (expenses / alert)
Violet:  #8b5cf6 (savings rate)
Pink:    #ec4899 (wants)

Dark bg:   #111827
Dark card: #1f2937
Light bg:  #ffffff
Light card: #f9fafb
```

The new designs are free to **completely replace** this palette — these colours are not sacred. What matters is that the new palette is cohesive, intentional, and serves the design concept.

---

## CURRENT SCREENS — ASCII WIREFRAME REFERENCE

### Web Dashboard (current layout)

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR (264px)      │  MAIN CONTENT                            │
│                      │                                          │
│ [BB] BudgetBuddy  ◁  │  Dashboard          < May 2026 >         │
│                      │  Your financial overview at a glance     │
│ ○ Overview           │                                          │
│   Transactions       │  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐  │
│   Budget             │  │ Inc  │ │ Exp  │ │ Net  │ │ Save % │  │
│   Analytics          │  │£4,200│ │£2,847│ │+£1,353│ │ 32.2%│  │
│   Import             │  └──────┘ └──────┘ └──────┘ └────────┘  │
│   Open Banking       │                                          │
│ ─────────────────    │  [Insight card: "Great Savings Rate!"]   │
│   Settings           │                                          │
│                      │  ┌──────────────┐  ┌──────────────────┐  │
│                      │  │ Budget 50/30 │  │  Daily Spending  │  │
│                      │  │ Needs   ████ │  │     📈 chart    │  │
│                      │  │ Wants   ███  │  │                  │  │
│                      │  │ Savings ███  │  │                  │  │
│                      │  └──────────────┘  └──────────────────┘  │
│                      │                                          │
│                      │  ┌────────────────────────────────────┐  │
│                      │  │ Recent Transactions        View All │  │
│                      │  │ Tesco            Groceries   -£64.50│  │
│                      │  │ Netflix          Entertainment-£15.99│ │
│                      │  │ BP Fuel          Transport   -£78.20│  │
│                      │  └────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile Dashboard (current layout)

```
┌─────────────────────┐
│ ████ status bar ████│
├─────────────────────┤
│  Welcome back       │
│  Your Finance       │
│  Overview           │
├─────────────────────┤
│  ┌────┐  ┌────┐    │
│  │Inc  │  │Exp  │   │
│  │£4.2k│  │£2.8k│   │
│  └────┘  └────┘    │
│  ┌────┐  ┌────┐    │
│  │Save │  │Rate │   │
│  │£536 │  │32.2%│   │
│  └────┘  └────┘    │
├─────────────────────┤
│  50/30/20 Budget    │
│  Needs  [████████░] │
│  Wants  [███████░░] │
│  Savings[████████░] │
├─────────────────────┤
│  Recent Transactions│
│  Tesco      -£64.50 │
│  Netflix    -£15.99 │
│  BP Fuel    -£78.20 │
├─────────────────────┤
│ 🏠  🧾  📊  📈  ⚙️ │
│Home Tx  Bgt Ana Set │
└─────────────────────┘
```

---

## SUMMARY TABLE

| # | Style | Web Codename | Mobile Codename | Key Feeling |
|---|-------|-------------|-----------------|-------------|
| 1 | **Brutalist** | BB-BRUT-WEB | BB-BRUT-MOB | Raw, confrontational, newspaper |
| 2 | **Glassmorphism** | BB-GLASS-WEB | BB-GLASS-MOB | Ethereal, premium, aurora |
| 3 | **Minimalist** | BB-MONO-WEB | BB-MONO-MOB | Calm, intelligent, editorial |
| 4 | **Retro Terminal** | BB-RETRO-WEB | BB-RETRO-MOB | Hacker, neon, cyberpunk |
| 5 | **Organic Bento** | BB-BENTO-WEB | BB-BENTO-MOB | Warm, tactile, friendly |

Each pair (web + mobile) within a concept number must share palette, typeface, and visual character.

---

*Asset pack prepared for Claude Design agent. Brief covers: current state analysis, design problems, 5 detailed concept specs, implementation constraints, layout wireframes, and sample data.*
