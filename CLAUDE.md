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
└── marketing/                  # Marketing/landing site

packages/features/              # Features (can import shared only)
├── auth/                       # Clerk integration
├── transactions/               # CSV parsing, AI classification, export
├── analytics/                  # 50/30/20 budgeting, charts
└── payments/                   # Stripe integration

packages/shared/                # Shared (can import shared only)
├── ui/                         # Shadcn components
├── db/                         # Drizzle schema & client
├── api/                        # tRPC root builder
├── ai/                         # Vercel AI SDK setup
├── email/                      # Resend + React Email templates
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
pnpm db:generate            # Generate Drizzle migrations
pnpm db:push                # Push schema to database
pnpm db:studio              # Open Drizzle Studio

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

- [ ] Set up PostgreSQL database and run migrations (run `pnpm infra:up` then `pnpm db:push`)

### Recently Completed

- [x] Add Vitest for unit testing (45 tests passing)
- [x] Implement Stripe payments (checkout, webhooks, subscriptions, plans)
- [x] Add marketing site (apps/marketing with hero, features, pricing, FAQ)
- [x] Add E2E tests with Playwright (landing page tests)
- [x] Set up CI/CD pipeline (GitHub Actions: lint, typecheck, test, build)
- [x] Add email notifications (Resend + React Email: welcome, budget alerts, weekly summary)
- [x] Implement data export feature (CSV, JSON, full data export)
- [x] Add Docker infrastructure (PostgreSQL, Redis via docker-compose)
- [x] Add rate limiting on API routes (Redis-backed with in-memory fallback)

## Security Considerations

- All financial data encrypted at rest
- Clerk handles authentication securely
- Input validation with Zod on all endpoints
- CSRF protection via tRPC
- Rate limiting on API routes (Redis-backed)
- Regular dependency audits
