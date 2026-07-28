# AI Finance Platform - Agent Instructions

## Project Overview

AI-powered personal finance dashboard with automatic transaction categorization and 50/30/20 budgeting. Privacy-first SaaS built with modern web technologies.

## Tech Stack

- **Build:** Turborepo (v2.x+) monorepo with strict boundary enforcement
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **API:** tRPC v11, React Query, Zod validation
- **Auth:** Clerk
- **Database:** PostgreSQL + Drizzle ORM
- **AI:** Vercel AI SDK with OpenAI
- **Styling:** Tailwind CSS, Shadcn/UI components
- **Payments:** Stripe
- **Email:** Resend with React Email templates
- **Testing:** Vitest (unit), Playwright (E2E)
- **CI/CD:** GitHub Actions

## Architecture

Three-layer architecture with strict import boundaries:

```
apps/                           # Compositions (can import all)
├── web/                        # Next.js Dashboard
├── marketing/                  # Marketing/landing site
└── mobile/                     # Expo mobile app

packages/compositions/
└── api-router/                 # Root tRPC router and exported AppRouter type

packages/features/              # Features (can import shared only)
├── auth/                       # Clerk integration
├── transactions/               # CSV parsing, rules engine, AI classification,
│                               #   recurring detection, export
├── analytics/                  # 50/30/20 budgeting, charts, accounts and net
│                               #   worth, savings goals, insights
├── banking/                    # Plaid/Open Banking integration
└── payments/                   # Stripe integration

packages/shared/                # Shared (can import shared only)
├── ui/                         # Shadcn components
├── db/                         # Drizzle schema & client
├── api/                        # tRPC root builder
├── ai/                         # Vercel AI SDK setup
├── email/                      # Resend + React Email templates
├── logger/                     # Pino logger (singleton)
└── config/                     # TypeScript, ESLint configs

e2e/                            # Playwright E2E tests
```

**Import Rules (enforced by Turborepo):**

- Compositions → can import Features + Shared
- Features → can only import Shared
- Shared → can only import Shared

## Critical Agent Instructions

### Before Completing Any Task

**ALWAYS run these checks before considering a task complete:**

```bash
# 1. Type checking - must pass with no errors
pnpm typecheck

# 2. Linting - must pass with no warnings
pnpm lint

# 3. Format code
pnpm format

# 4. Run tests (when available)
pnpm test
```

Fix any issues before marking the task complete.

### Git Workflow

**Commit regularly with meaningful messages:**

```bash
# Check status frequently
git status

# Stage specific files (avoid git add .)
git add <specific-files>

# Commit with descriptive message
git commit -m "feat/fix/refactor: description of changes"
```

**Commit message prefixes:**

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `style:` Formatting, styling
- `docs:` Documentation
- `test:` Adding tests
- `chore:` Maintenance tasks

**Commit after:**

- Completing a logical unit of work
- Before switching to a different task
- After fixing lint/type errors
- At natural stopping points

### Code Quality Standards

1. **TypeScript:** Strict mode, no `any` types without justification
2. **Security:** Follow OWASP guidelines, sanitize inputs
3. **React:** Use Server Components by default, `"use client"` only when needed
4. **Imports:** Respect boundary rules - features cannot import other features
5. **Testing:** Write tests for business logic (calculations, parsers)
6. **Dependencies:** Always use pnpm workspace catalog (see below)
7. **Logging:** Use `@finance/logger` instead of `console.log` (enforced by ESLint)

### Logging

**NEVER use `console.log` - use `@finance/logger` instead.**

The logger provides structured logging with automatic redaction of sensitive fields, pretty output in development, and JSON output in production.

```typescript
import { logger, createTimer } from "@finance/logger";

// Create a child logger for the module
const log = logger.child({ module: "transactions" });

// Log levels: debug, info, warn, error, fatal
log.debug({ userId, input }, "Processing request");
log.info({ transactionId, durationMs: timer.elapsed() }, "Transaction created");
log.warn({ userId }, "User not found");
log.error({ err: error }, "Failed to process payment");

// Use createTimer for measuring duration
const timer = createTimer();
await doSomething();
log.info({ durationMs: timer.elapsed() }, "Operation complete");
```

**Logging guidelines:**

- Use `debug` for detailed flow information (inputs, intermediate states)
- Use `info` for significant events (request completed, entity created)
- Use `warn` for unexpected but handled situations (not found, validation failed)
- Use `error` for failures that need attention
- Always include relevant context (userId, entityId, duration)
- Log at start and end of significant operations

### Adding Dependencies

**ALWAYS use the pnpm workspace catalog for dependency versions.**

All external dependencies must be defined in `pnpm-workspace.yaml` under the `catalog:` section. Package.json files should reference `catalog:` instead of version numbers.

### Key Files & Locations

- **Database Schema:** `packages/shared/db/src/schema/`
- **tRPC Routers:** `packages/features/*/src/router.ts`
- **UI Components:** `packages/shared/ui/src/components/`
- **Dashboard Pages:** `apps/web/src/app/(dashboard)/dashboard/`
- **API Routes:** `apps/web/src/app/api/`
- **Stripe Integration:** `packages/features/payments/src/`
- **Email Templates:** `packages/shared/email/src/templates/`
- **E2E Tests:** `e2e/`
- **CI/CD:** `.github/workflows/ci.yml`

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
# Use pnpm infra:up to start local PostgreSQL and Redis
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance
REDIS_URL=redis://localhost:6379

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
APP_URL=http://localhost:3000
RESEND_API_KEY=re_...
```

### Common Commands

```bash
# Development
pnpm dev                    # Start all apps in dev mode
pnpm dev --filter=@finance/web  # Start only web app

# Building
pnpm build                  # Build all packages
pnpm typecheck              # Type check all packages

# Code Quality
pnpm lint                   # Lint all packages
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Format all files

# Unit Testing
pnpm test                   # Run tests in watch mode
pnpm test:run               # Run tests once
pnpm test:coverage          # Run tests with coverage

# E2E Testing
pnpm test:e2e               # Run Playwright tests
pnpm test:e2e:ui            # Run Playwright with UI mode

# Infrastructure (Docker)
pnpm infra:up               # Start PostgreSQL and Redis containers
pnpm infra:down             # Stop all containers
pnpm infra:debug            # Start with pgAdmin and Redis Commander

# Database
pnpm db:generate            # Generate a versioned SQL migration from the schema
pnpm db:migrate             # Apply pending migrations (deploy/CI/prod path)
pnpm db:push                # Push schema directly without a migration (fast local dev only)
pnpm db:studio              # Open Drizzle Studio

# Migration workflow:
#   1. Edit schema in packages/shared/db/src/schema/*
#   2. `pnpm db:generate` to create a migration in packages/shared/db/drizzle/
#   3. Review the generated SQL, commit it
#   4. `pnpm db:migrate` to apply it (run this on deploy; tracked in drizzle.__drizzle_migrations)
# Use `db:push` only to iterate quickly in local dev — never as the production deploy path.

# Cleaning
pnpm clean                  # Clean all build artifacts
```

## Current Progress

### Completed

- [x] Turborepo monorepo setup with boundaries
- [x] Shared packages: ui, db, api, ai, config
- [x] Feature packages: auth, transactions, analytics
- [x] Web app with dashboard, landing page
- [x] 50/30/20 budget system
- [x] AI transaction classification
- [x] CSV import from major banks
- [x] ESLint & Prettier configuration

### TODO

- [ ] Wire `pnpm db:migrate` into the deployment pipeline (migrations themselves work;
      nothing runs them on deploy)
- [ ] Credential setup — see `HUMAN_TASKS.md` (Clerk, OpenAI, Stripe, Plaid, Resend)

### Recently Completed

- [x] Categorisation rules engine (deterministic matching ahead of the AI classifier,
      ~100 built-in UK merchant rules, preview and backfill)
- [x] Account defaults provisioned on signup (categories + starter rules)
- [x] Accounts and net worth (asset/liability types, balance snapshot history)
- [x] Recurring payment and subscription detection (statistical, no merchant list)
- [x] Savings goals with pacing (required contribution, projection, on-track/behind)
- [x] Spending insights and anomaly detection
- [x] Bulk transaction editing and advanced filters
- [x] Email notifications wired to real triggers (welcome, budget alerts, weekly summary)
- [x] Vitest coverage (231 unit, 61 integration against real Postgres)
- [x] Stripe billing, marketing site, Playwright E2E, CI/CD, data export, Docker infra,
      Redis-backed rate limiting

### Gotchas worth knowing

- **Env files are per-app.** Next.js only reads `.env` from `apps/web/`, not the repo root.
  Root `.env` is used by `pnpm db:seed` and Playwright; `apps/web/.env.local` is what the
  app itself reads. Both need the same values.
- **Turbo runs in strict env mode.** Any new environment variable must be declared in
  `turbo.json` `globalEnv` or tasks will not see it.
- **Playwright and dev share `apps/web/.next`.** Both must use the same bundler; the
  Playwright web server passes `--turbopack` to match. Running `pnpm build` (webpack)
  before `pnpm dev` can still leave mixed artifacts — `rm -rf apps/web/.next` if the dev
  server reports a missing runtime chunk.
- **Category state lives in three fields.** `categoryId` (joined by the transactions UI),
  `aiClassified` and `necessityScore` (read by analytics). Always write all three together
  or the two views disagree.
- **`DEV_AUTH_USER_ID` signs you in as a seeded user without Clerk**, for opening the
  dashboard to check it visually. Only honoured when `NODE_ENV=development`; a production
  build throws at startup if it is set (`apps/web/src/instrumentation.ts`). Get a user ID
  from `pnpm db:seed` output or the `users` table.
- **Client-safe exports must not import values from `@finance/db`.** Anything re-exported
  from a feature package's `index.ts` reaches the browser; a value import pulls in the
  Postgres driver and breaks the bundle. Use `import type`.

## Security Considerations

- All financial data encrypted at rest
- Clerk handles authentication securely
- Input validation with Zod on all endpoints
- CSRF protection via tRPC
- Rate limiting on API routes (Redis-backed)
- Regular dependency audits
