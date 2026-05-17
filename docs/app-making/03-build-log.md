# Budget Buddy build log

## 2026-05-17 — Production-readiness wedge

Objective: close the Budget Buddy TODOs by replacing simulator auth shortcuts with mock mode, improving mobile import parity, improving landing visuals, adding reusable market-signal process, and running QA gates.

Files changed: pending final diff.

Verification: pending.

## 2026-05-17 implementation updates

- Replaced legacy simulator auth shortcut references with explicit `EXPO_PUBLIC_AUTH_MODE=mock` development mock mode.
- Added mobile transaction import handoff card that opens the web CSV import flow via `EXPO_PUBLIC_WEB_URL`/Expo `extra.webUrl`.
- Added generated SVG logo and product preview assets manually after Gemini CLI/image provider were unavailable without a configured API key.
- Reworked the marketing homepage around the CSV-first, privacy-first UK budgeting wedge identified by the market signal check.

- Added explicit Clerk bearer-token verification for mobile tRPC requests while preserving web cookie/session auth fallback.
