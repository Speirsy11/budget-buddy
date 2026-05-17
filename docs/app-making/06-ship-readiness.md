# Budget Buddy ship readiness

Date: 2026-05-17

## Verdict

**Not ready to ship publicly yet, but materially closer.**

The app now has a safer mobile development setup, explicit release guards, a stronger CSV-first product story, a mobile/web import handoff, and a market signal report. The remaining blockers are mostly external/release readiness rather than local source hygiene.

## Completed in this pass

- Replaced the old local Clerk shortcut with explicit `EXPO_PUBLIC_AUTH_MODE=mock` development mock mode.
- Added release guards that fail preview/production mobile builds when mock auth or localhost API URLs are configured.
- Confirmed Xcode already points globally at `/Applications/Xcode.app/Contents/Developer`; no sudo `xcode-select` change required.
- Kept generated `apps/mobile/ios`/Pods workaround noise out of source changes.
- Added Clerk bearer-token verification for mobile tRPC calls while preserving web cookie/session auth.
- Added mobile Transactions CSV import handoff to the web `/dashboard/import` flow.
- Reworked the marketing homepage around the privacy-first CSV budgeting wedge.
- Added SVG brand/product preview assets without committing secrets.
- Added reusable market signal audit skill and Budget Buddy market signal report.

## Still blocked before release

- Configure real preview/production API URLs in EAS/environment.
- Add a real Clerk development token smoke test for mobile tRPC bearer auth; do not commit tokens.
- Decide whether native mobile CSV import is needed for v1 or whether web handoff is acceptable.
- Resolve Expo/RN/Xcode 26 native build compatibility without relying on generated Pods patches.
- Decide iOS billing policy before exposing paid mobile upgrade flows; Stripe in-app may not be acceptable for consumer digital features.
- Run device/simulator QA screenshots against a real dev backend.
- Get explicit approval before deploys, pushes, TestFlight/App Store, provider accounts, or payment configuration.

## External actions requiring approval

TestFlight/App Store, deploys, Stripe/IAP, Open Banking provider accounts, public launch copy, real financial data testing, GitHub pushes.

## Latest verification

- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `source .env && pnpm build` — passed.
- Mobile release guard checks — localhost production API and production mock auth fail as expected; HTTPS production API without mock auth passes.

- `pnpm test:run` — passed: 2 test files, 51 tests.
