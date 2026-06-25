# Budget Buddy

Budget Buddy is a TypeScript/Turborepo personal finance app with a Next.js web app, Expo mobile app, shared tRPC API packages, Drizzle/Postgres persistence, Clerk auth, Plaid banking integrations, Stripe billing, and AI-assisted transaction classification.

## Apps

- `apps/web` — authenticated Budget Buddy dashboard.
- `apps/marketing` — public marketing site.
- `apps/mobile` — Expo/React Native mobile app.

## Local setup

```sh
pnpm install
cp .env.example .env
pnpm infra:up
pnpm db:push
pnpm dev
```

To populate a local database with repeatable demo data for a Clerk user:

```sh
pnpm db:seed -- --user-id=<your_clerk_user_id>
```

The seed command is idempotent for that user, so it can be rerun safely.

Required services for the full product:

- Postgres via `DATABASE_URL`
- Redis via `REDIS_URL`
- Clerk via `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and mobile `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Plaid via `PLAID_CLIENT_ID`, `PLAID_SECRET`, and `PLAID_ENV`
- Stripe via `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, price IDs, and webhook secret
- OpenAI via `OPENAI_API_KEY`, unless `MOCK_FUNCTIONALITY="true"`
- Resend via `RESEND_API_KEY` when email sending is enabled

## Production checks

Before deploying, run:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

For local production-build verification from the repository root, load `.env` first because Next.js apps run from their package directories:

```sh
set -a; source .env; set +a; pnpm build
```

## Safety notes

- Never commit real `.env` files or service secrets.
- The mobile development mock auth mode is gated behind `__DEV__` plus `EXPO_PUBLIC_AUTH_MODE=mock`, and release builds fail if it is enabled.
- Generated native Expo folders are ignored; use `expo prebuild`/`expo run:*` locally when needed.
