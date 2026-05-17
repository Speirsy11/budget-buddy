# Mobile production-readiness and web parity audit

Date: 2026-05-17

## Scope

This audit covers the current `apps/mobile` Expo app against the existing web dashboard in `apps/web`, plus the shared API/features packages that the mobile app depends on. It is intended to turn the current local simulator rescue work into a production-readiness backlog.

## Current state

### What is already in good shape

- **Core screens exist on both platforms:** dashboard, analytics, budget, transactions, and settings all have mobile tab routes matching the main web dashboard routes.
- **Shared backend model is suitable for mobile:** transactions support `csv`, `open_banking`, and `manual` sources, plus bank connection/external ID metadata for dedupe.
- **Feature gates are present server-side:** free/pro tier config gates open banking and raises AI/upload limits for paid plans.
- **Basic quality gates pass:** targeted mobile/marketing typecheck and lint completed successfully after this production-readiness pass.
- **Development mock auth mode is explicitly dev-gated:** mobile mock mode checks `__DEV__ && EXPO_PUBLIC_AUTH_MODE === "mock"` and README documents that it must not be set for preview/production builds.
- **Generated native projects are ignored:** `.gitignore` excludes `apps/mobile/ios` and `apps/mobile/android`, which keeps the Xcode local workaround artifacts out of source control.

### Web/mobile feature parity snapshot

| Capability                               | Web                                       | Mobile                                                                      | Gap                                                                |
| ---------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Dashboard overview                       | Present                                   | Present                                                                     | Likely styling/data parity only.                                   |
| Analytics                                | Present                                   | Present                                                                     | Verify chart parity and empty/error states.                        |
| Budget / 50-30-20                        | Present                                   | Present                                                                     | Verify editing UX and copy parity.                                 |
| Transactions list/search/classify/delete | Present                                   | Present                                                                     | Mostly present; mobile needs stronger typed tRPC and UX hardening. |
| CSV import                               | Present at `/dashboard/import`            | Missing                                                                     | Highest visible parity gap.                                        |
| Bank-specific CSV guides                 | Present on web import page                | Missing                                                                     | Needed if mobile gets import.                                      |
| Export data                              | Present in web settings                   | Mobile links user back to web                                               | Acceptable for v1 if intentional; document as web-only.            |
| Theme settings                           | Present on web                            | Mobile has theme provider but no equivalent appearance controls in settings | Parity/design gap.                                                 |
| Account deletion                         | Web has disabled “Contact support” action | Mobile does not show account deletion                                       | Minor parity gap.                                                  |
| Open banking                             | Backend router exists and is Pro-gated    | No mobile UI found                                                          | Major product gap if Pro subscriptions launch with mobile.         |
| Stripe checkout/billing portal           | Payments package exists                   | No exposed web route/API or mobile flow found                               | Revenue-path gap, not just mobile parity.                          |

## Production blockers / risks

### P0 — authentication context needed explicit mobile bearer support

`apps/web/src/server/trpc.ts` uses Clerk server `auth()` to identify the user. Mobile sends a bearer token from `@clerk/clerk-expo`, but the tRPC route currently calls the same web context and no code path was found that verifies the mobile bearer token.

Risk before this pass: a real mobile device could reach `/api/trpc` but still be treated as unauthenticated if only cookie/session auth was read. The development mock mode could mask this.

2026-05-17 implementation update:

1. Added explicit `Authorization: Bearer <token>` verification in the web tRPC context using Clerk server `verifyToken`.
2. Kept cookie/session auth as the fallback for web requests.
3. Added Clerk user sync by user ID for verified bearer-token requests.

Remaining: add an integration smoke test using a real Clerk development token or a Clerk-supported test token fixture; do not commit real tokens.

### P0 — mobile API base URL is not production-configured

`apps/mobile/src/lib/trpc/provider.tsx` reads `Constants.expoConfig?.extra?.apiUrl`, but `apps/mobile/app.json` currently does not define `extra.apiUrl`. The fallback is `http://localhost:3000`, which only works for limited local simulator cases.

Recommended fix:

1. Add `extra.apiUrl` via Expo config using `EXPO_PUBLIC_API_URL`.
2. Document dev, preview, and production values.
3. Fail loudly in non-dev builds if the API URL is missing or points to localhost.

2026-05-15 implementation update:

- Added `apps/mobile/app.config.js` to map `EXPO_PUBLIC_API_URL` into Expo `extra.apiUrl` while keeping the existing static `app.json` as the base config.
- Added `apps/mobile/scripts/assert-safe-env.js` and wired it into `build:ios`, `build:android`, and `eas-build-pre-install`.
- Added `apps/mobile/eas.json` with development/preview/production profiles; preview and production intentionally require a real API URL from the build environment.
- Hardened `apps/mobile/src/lib/trpc/provider.tsx` so release builds throw if `extra.apiUrl` is missing or points to localhost.
- Verification: `pnpm --filter @finance/mobile lint` passed; `pnpm --filter @finance/mobile typecheck` passed; guard correctly failed with `EAS_BUILD_PROFILE=production EXPO_PUBLIC_API_URL=http://localhost:3000`.

Remaining: choose the real preview/production API URL and supply it through EAS/env before attempting a release build.

### P0 — local mock mode env must be impossible in production

The mock mode is dev-gated in JS, which is good, but `apps/mobile/.env` currently sets `EXPO_PUBLIC_AUTH_MODE=mock` locally. Expo public env vars can easily leak into a preview build if profiles are not strict.

Recommended fix:

1. Add EAS build profiles with explicit production env that omits the mock mode flag.
2. Add a prebuild/build assertion that fails when `EXPO_PUBLIC_AUTH_MODE=mock` and `NODE_ENV`/profile is not development.
3. Keep `.env` ignored; keep only `.env.example` committed.

2026-05-15 implementation update:

- Added the same release-profile guard to fail preview/production builds when `EXPO_PUBLIC_AUTH_MODE=mock`.
- Verified the mobile package still passes lint and typecheck after the guard.

Remaining: keep local `.env` uncommitted and set EAS environment variables explicitly before any approved preview/production build.

### P1 — CSV import is the largest user-facing mobile parity gap

Web has a dedicated import page with upload, parsing, validation/import mutation, and bank-specific CSV guidance. Mobile transactions has list/search/classify/delete, plus a v1 web import handoff card.

Recommended mobile v1 options:

- **Best v1:** add an Import tab/screen using `expo-document-picker`, parse CSV client-side or upload raw content to the existing import mutation, and reuse the web validation semantics.
- **Implemented v1:** mobile Transactions now includes a clear “Import CSV on web” card using `EXPO_PUBLIC_WEB_URL`/`extra.webUrl`, with help text and a deep link to `/dashboard/import`.

### P1 — payment/subscription UX is incomplete

The payments package supports Stripe checkout, subscriptions, and billing portal creation, but no web app route/API or mobile flow was found exposing checkout/billing management. Open banking is Pro-gated, so this blocks a coherent Pro/mobile story.

Recommended fix:

1. Add web account/billing controls first.
2. For mobile, use a policy-compliant subscription approach before shipping. If this is a consumer iOS app selling digital app features, Apple IAP may be required instead of Stripe checkout in-app.
3. Make Pro-gated mobile screens explain the upgrade path without dead-ending.

### P1 — open banking has backend but no mobile UX

The banking router supports link token creation, token exchange, connection removal, sync, and update link token. No mobile UI was found for connecting/syncing accounts.

Recommended fix:

1. Decide whether mobile v1 supports bank linking or treats it as web-only.
2. If mobile supports it, add Plaid Link/Open Banking mobile dependency and a Pro upsell/locked state.
3. If web-only, add clear mobile messaging and avoid showing unavailable Pro value props.

### P2 — mobile tRPC typing is intentionally weak

Mobile uses `AnyRouter` plus a `Record<string, any>` proxy because it does not directly consume server router types.

Risk: mobile API drift will not be caught well by TypeScript.

Recommended fix:

- Export `AppRouter` from a shared package or create a lightweight API contract package consumable by mobile without importing web/server-only code.

### P2 — settings/preferences are mostly UI-only

Both web and mobile show notification preferences, but they appear to be local/placeholder switches rather than persisted settings. Web has appearance controls and export; mobile has notification placeholders and web-only export alert.

Recommended fix:

- Either persist preferences in a shared user settings table/API, or label them as coming soon until implemented.

## Revenue/pricing note

See [`revenue-readiness-notes-2026-05-15.md`](revenue-readiness-notes-2026-05-15.md), [`open-banking-provider-inventory-2026-05-15.md`](open-banking-provider-inventory-2026-05-15.md), and [`mobile-csv-value-path.md`](mobile-csv-value-path.md) for current UK budgeting/open-banking pricing signals, provider-economics risks, and the recommendation to validate CSV/mobile value before depending on Open Banking subscriptions.

## Suggested next implementation order

1. **Harden mobile auth/API config** — bearer token verification, production API URL, EAS profiles, and mock mode build guard are now in place; remaining work is an integration smoke test with a real Clerk dev token.
2. **Add mobile import v1** — implemented explicit web handoff card; native document-picker import remains a later enhancement.
3. **Make Pro story coherent** — billing management route on web, mobile-safe upgrade path, and clear open-banking locked/web-only states.
4. **Improve mobile contract safety** — replace untyped tRPC client with shared router/contract types.
5. **Polish parity/UX** — appearance settings, account deletion/contact support, empty/error/loading states, and analytics chart parity.

## Verification performed

- `pnpm --filter @finance/mobile typecheck` — passed on 2026-05-17.
- `pnpm --filter @finance/marketing typecheck` — passed on 2026-05-17.
- `pnpm --filter @finance/mobile lint` — passed on 2026-05-17.
- `pnpm --filter @finance/marketing lint` — passed on 2026-05-17.
- `pnpm --filter @finance/web typecheck` — passed on 2026-05-17.
- `pnpm --filter @finance/auth typecheck` — passed on 2026-05-17.
- `pnpm --filter @finance/web lint` — passed on 2026-05-17.
- `pnpm --filter @finance/auth lint` — passed on 2026-05-17.
- `pnpm --filter @finance/marketing build` — passed on 2026-05-17.
- Inspected app route trees for web and mobile.
- Inspected mobile tRPC provider/client, web tRPC route/context, DB transaction/subscription schema, tier limits, banking router, payments checkout/subscription support, web import/settings pages, and mobile transactions/settings pages.
