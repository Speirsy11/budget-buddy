# Budget Buddy product plan

## Product thesis

Budget Buddy should win trust before automation: make CSV import and daily mobile budget review polished enough that users can get value without persistent bank connections.

## Target user

UK users who want a lightweight spending/budget check and are comfortable exporting CSVs from Monzo, Starling, Revolut, Barclays, or similar banks.

## Non-users

- Users who require automatic bank sync on day one.
- Users seeking financial advice or investment recommendations.
- Users unwilling to import bank CSVs manually.

## v0 scope for this pass

- Replace the local Clerk shortcut with an explicit development-only mock auth mode.
- Harden preview/production mobile API URL and mock-mode guards.
- Add mobile CSV import handoff so the Transactions tab has a clear next action.
- Improve marketing/homepage visuals with reusable brand assets.
- Write productization/market-signal report using the reusable skill.
- Run lint/typecheck/build where available.

## Non-goals

- No TestFlight/App Store build.
- No Stripe/IAP launch.
- No Open Banking provider account or real bank data handling.
- No production deploy.

## UX flows

1. Mobile unauthenticated user: Clerk sign-in unless dev mock mode is explicitly enabled.
2. Mobile mock mode: dashboard opens with clearly fake local user identity and no production pathway.
3. Transactions empty state: explains web CSV import and privacy positioning.
4. Marketing visitor: sees clearer trust-first positioning and product visual.

## Security/privacy posture

- Mock auth only in `__DEV__` and blocked in EAS preview/production.
- Preview/production API URL must be real HTTPS, not localhost.
- Avoid public claims about bank-level security unless implementation evidence exists.
- Do not log transaction contents.

## QA gates

- `pnpm --filter @finance/mobile typecheck`
- `pnpm --filter @finance/mobile lint`
- `pnpm --filter @finance/marketing typecheck`
- `pnpm --filter @finance/marketing lint`
- `pnpm --filter @finance/web typecheck`
- Guard script negative tests for production mock/localhost.
