# Budget Buddy QA report

Pending verification commands.

## 2026-05-17 targeted gates

- `pnpm --filter @finance/mobile typecheck` — passed.
- `pnpm --filter @finance/marketing typecheck` — passed.
- `pnpm prettier --write ...` — source/docs formatted; `.env.example` was intentionally skipped after Prettier reported no inferred parser.
- `pnpm --filter @finance/mobile lint` — passed.
- `pnpm --filter @finance/marketing lint` — passed.

- `pnpm --filter @finance/web typecheck` — passed.
- `pnpm --filter @finance/auth typecheck` — passed.
- `pnpm --filter @finance/web lint` — passed.
- `pnpm --filter @finance/auth lint` — passed.
- `pnpm --filter @finance/marketing build` — passed.
- Mobile build guard checks — production localhost URL failed as expected, production mock auth failed as expected, production HTTPS API URL passed.

- `pnpm build` without Clerk env — failed as expected because Next/Clerk requires a real publishable key while prerendering dashboard pages.
- `source .env && pnpm build` — passed; secret values were not printed or committed.

- `pnpm test:run` — passed: 2 test files, 51 tests.
