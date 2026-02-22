# Convex Migration Plan — Budget Buddy

> **Status:** Planning
> **Date:** 2026-02-22
> **Scope:** Migrate from PostgreSQL + Drizzle ORM + tRPC to Convex backend

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture](#2-current-architecture)
3. [Target Architecture](#3-target-architecture)
4. [Schema Migration](#4-schema-migration)
5. [Authentication Migration](#5-authentication-migration)
6. [API Layer Migration (tRPC → Convex Functions)](#6-api-layer-migration)
7. [Frontend Integration](#7-frontend-integration)
8. [External Services](#8-external-services)
9. [Real-Time Features](#9-real-time-features)
10. [File Uploads (CSV Import)](#10-file-uploads)
11. [Rate Limiting](#11-rate-limiting)
12. [Testing Strategy](#12-testing-strategy)
13. [Data Migration](#13-data-migration)
14. [Monorepo Adjustments](#14-monorepo-adjustments)
15. [Migration Phases](#15-migration-phases)
16. [Risk Assessment](#16-risk-assessment)
17. [Rollback Strategy](#17-rollback-strategy)

---

## 1. Executive Summary

### Why Convex?

- **Real-time by default** — All queries auto-update via WebSocket subscriptions, replacing React Query polling
- **Simplified backend** — Eliminates tRPC, Drizzle ORM, PostgreSQL, and Redis infrastructure
- **Type safety** — End-to-end TypeScript with generated types (similar to tRPC but built-in)
- **Serverless** — No database provisioning, connection pooling, or Docker infrastructure needed
- **Built-in features** — File storage, scheduled functions, search indexes replace custom solutions

### What Changes

| Layer | Current | Target |
|-------|---------|--------|
| Database | PostgreSQL + Drizzle ORM | Convex Documents |
| API | tRPC v11 + React Query | Convex queries/mutations/actions |
| Real-time | React Query polling (5s stale) | Convex WebSocket subscriptions |
| Rate Limiting | Redis + in-memory fallback | Convex rate limiter library |
| File Storage | Server-side parsing | Convex file storage + actions |
| Webhooks | Next.js API routes | Convex HTTP actions |
| Infrastructure | Docker (PostgreSQL, Redis) | Convex Cloud (managed) |
| Auth | Clerk (unchanged) | Clerk (unchanged, new integration path) |

### What Stays the Same

- **Clerk authentication** — Same provider, different integration point
- **AI classification** — OpenAI calls move to Convex actions but logic is identical
- **CSV parsing** — PapaParse logic is fully reusable
- **UI components** — All React components, Shadcn/UI, charts stay unchanged
- **Stripe integration** — Same SDK, webhooks via Convex HTTP actions
- **Email** — Resend calls move to Convex actions
- **Business logic** — 50/30/20 calculations, analytics, export logic all reusable
- **Monorepo structure** — Turborepo boundaries preserved

---

## 2. Current Architecture

```
Browser
  ↓ React Query (httpBatchLink)
Next.js API Route (/api/trpc)
  ↓ tRPC fetchRequestHandler
tRPC Router (auth + transactions + analytics)
  ↓ Clerk auth context
  ↓ Redis rate limiting
Drizzle ORM
  ↓
PostgreSQL
```

**Key packages affected:**
- `packages/shared/db/` — Drizzle schema + client (replaced)
- `packages/shared/api/` — tRPC root builder + rate limiting (replaced)
- `packages/features/transactions/src/router.ts` — tRPC procedures (rewritten)
- `packages/features/analytics/src/router.ts` — tRPC procedures (rewritten)
- `packages/features/auth/src/router.ts` — tRPC procedure (rewritten)
- `packages/features/auth/src/sync-user.ts` — User sync (replaced by Convex auth)
- `apps/web/src/trpc/` — Client setup + provider (replaced)
- `apps/web/src/server/routers/` — App router merge (replaced)
- `apps/web/src/app/api/trpc/` — API route handler (removed)

---

## 3. Target Architecture

```
Browser
  ↓ ConvexReactClient (WebSocket)
Convex Cloud
  ├── queries/   (read, real-time, cached)
  ├── mutations/ (write, transactional, ACID)
  ├── actions/   (side effects: OpenAI, Stripe, Resend)
  └── http/      (webhooks: Stripe, Clerk)
  ↓
Convex Document Store (replaces PostgreSQL)
```

### New directory structure

```
convex/                          # NEW: Convex backend (lives at repo root)
├── schema.ts                    # Document schema definitions
├── auth.config.ts               # Clerk integration config
├── _generated/                  # Auto-generated types (gitignored)
│
├── users.ts                     # User queries/mutations
├── transactions.ts              # Transaction CRUD + filtering
├── categories.ts                # Category management
├── budgets.ts                   # Budget + allocation management
├── analytics.ts                 # Analytics queries (50/30/20, trends)
├── subscriptions.ts             # Subscription management
│
├── ai.ts                        # Action: OpenAI classification
├── email.ts                     # Action: Resend email sending
├── stripe.ts                    # Action: Stripe API calls
│
├── http.ts                      # HTTP routes (Stripe webhooks, etc.)
└── crons.ts                     # Scheduled jobs (optional)
```

---

## 4. Schema Migration

### Current (Drizzle/PostgreSQL)

The current schema defines 5 tables: `users`, `transactions`, `categories`, `budgets`, `budgetAllocations`, and `subscriptions`, using SQL types and foreign key relations.

### Target (Convex)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),       // Clerk user ID (was `id` primary key)
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  transactions: defineTable({
    userId: v.string(),         // Clerk user ID (denormalized)
    amount: v.float64(),
    date: v.float64(),          // Unix timestamp (ms)
    description: v.string(),
    merchant: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    necessityScore: v.optional(v.float64()),
    aiClassified: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_userId_categoryId", ["userId", "categoryId"]),

  categories: defineTable({
    userId: v.optional(v.string()),  // null for system categories
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    necessityType: v.union(
      v.literal("need"),
      v.literal("want"),
      v.literal("savings")
    ),
    isSystem: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_system", ["isSystem"]),

  budgets: defineTable({
    userId: v.string(),
    categoryId: v.optional(v.id("categories")),
    name: v.optional(v.string()),
    amount: v.optional(v.float64()),
    period: v.optional(v.string()),   // 'monthly' | 'weekly' | 'yearly'
    month: v.optional(v.float64()),
    year: v.optional(v.float64()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_month_year", ["userId", "month", "year"]),

  budgetAllocations: defineTable({
    userId: v.string(),
    totalIncome: v.float64(),
    needsPercent: v.float64(),    // default 50
    wantsPercent: v.float64(),    // default 30
    savingsPercent: v.float64(),  // default 20
    month: v.float64(),
    year: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_month_year", ["userId", "month", "year"]),

  subscriptions: defineTable({
    stripeSubscriptionId: v.string(),
    userId: v.string(),
    customerId: v.string(),
    status: v.string(),
    planId: v.string(),
    priceId: v.optional(v.string()),
    currentPeriodStart: v.optional(v.float64()),
    currentPeriodEnd: v.optional(v.float64()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    canceledAt: v.optional(v.float64()),
    trialStart: v.optional(v.float64()),
    trialEnd: v.optional(v.float64()),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("by_customerId", ["customerId"]),
});
```

### Key Schema Differences

| Concept | Drizzle/PostgreSQL | Convex |
|---------|-------------------|--------|
| Primary key | `text` (custom UUID) | `_id` (auto-generated `Id<"table">`) |
| Foreign keys | Explicit FK constraints | No FK constraints; use `v.id("table")` for type safety |
| Timestamps | `timestamp` columns | `_creationTime` auto-field + manual `v.float64()` |
| Enums | pgEnum | `v.union(v.literal(...))` |
| Indexes | SQL indexes | `defineTable().index()` |
| Relations | Drizzle `relations()` | Manual joins via queries |
| NULL | nullable columns | `v.optional()` |
| Cascading deletes | FK CASCADE | Must implement manually in mutations |

### Migration Notes

- **`_creationTime`**: Convex auto-adds this to every document — replaces `createdAt`
- **No `updatedAt`**: Must be maintained manually if needed (add as optional field)
- **User ID as string**: Keep using Clerk user IDs as `userId` strings (not Convex `Id<"users">`) for simpler auth patterns
- **Dates as numbers**: Convert all `Date` objects to `number` (milliseconds since epoch)
- **No auto-increment**: Convex uses opaque document IDs; no sequential IDs

---

## 5. Authentication Migration

### Current: Clerk + tRPC Context

```typescript
// Current: packages/features/auth/src/sync-user.ts
// 1. Clerk middleware validates JWT
// 2. tRPC createContext() calls auth() to get userId
// 3. syncUser() upserts Clerk user data into PostgreSQL users table
// 4. All procedures access ctx.userId
```

### Target: Clerk + Convex Native Auth

Convex has first-class Clerk support. The integration replaces the manual user sync.

**Step 1: Configure Clerk in Convex**

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

**Step 2: Set up Clerk JWT template**

In the Clerk Dashboard, create a JWT template named "convex" that includes:
- `sub` (user ID)
- `email`
- `name`

**Step 3: Client-side provider**

```typescript
// apps/web/src/app/providers.tsx
"use client";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

**Step 4: Access auth in Convex functions**

```typescript
// convex/users.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMe = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});
```

### What Changes

- **Removed:** `syncUser()` function — replaced by Clerk webhook that creates/updates users in Convex
- **Removed:** tRPC `createContext()` auth logic
- **Added:** Clerk webhook handler (Convex HTTP action) to sync user data on sign-up/update
- **Simplified:** `ctx.auth.getUserIdentity()` replaces manual auth() + context threading

### Clerk Webhook for User Sync

```typescript
// convex/http.ts (partial)
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify webhook signature using Clerk SDK
    const payload = await request.json();
    const { type, data } = payload;

    if (type === "user.created" || type === "user.updated") {
      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: data.id,
        email: data.email_addresses[0]?.email_address,
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

---

## 6. API Layer Migration

### Migration Pattern: tRPC Procedure → Convex Function

Each tRPC procedure maps to a Convex function:

| tRPC Concept | Convex Equivalent |
|-------------|-------------------|
| `publicProcedure.query()` | `query({...})` |
| `protectedProcedure.query()` | `query({...})` + `ctx.auth.getUserIdentity()` |
| `protectedProcedure.mutation()` | `mutation({...})` |
| `aiRateLimitedProcedure.mutation()` | `action({...})` + rate limiter |
| `.input(zodSchema)` | `args: { field: v.string(), ... }` |
| `TRPCError` | `ConvexError` |
| React Query `useQuery` | Convex `useQuery` (real-time) |
| React Query `useMutation` | Convex `useMutation` |

### Transactions Router Migration

**Current (`packages/features/transactions/src/router.ts`):**
```typescript
// tRPC: list transactions with filters
list: protectedProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
    categoryId: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    search: z.string().optional(),
  }))
  .query(async ({ ctx, input }) => { ... })
```

**Target (`convex/transactions.ts`):**
```typescript
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// List transactions with pagination and filters
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    let q = ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (q) => {
        let query = q.eq("userId", userId);
        if (args.startDate) query = query.gte("date", args.startDate);
        if (args.endDate) query = query.lte("date", args.endDate);
        return query;
      })
      .order("desc");

    // Filter by category in-memory if needed
    const results = await q.paginate(args.paginationOpts);

    // Apply additional filters
    let filtered = results.page;
    if (args.categoryId) {
      filtered = filtered.filter((t) => t.categoryId === args.categoryId);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(s) ||
          t.merchant?.toLowerCase().includes(s)
      );
    }

    return { ...results, page: filtered };
  },
});

// Create a transaction
export const create = mutation({
  args: {
    amount: v.float64(),
    date: v.float64(),
    description: v.string(),
    merchant: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db.insert("transactions", {
      ...args,
      userId: identity.subject,
    });
  },
});

// Bulk create (for CSV import)
export const createMany = mutation({
  args: {
    transactions: v.array(
      v.object({
        amount: v.float64(),
        date: v.float64(),
        description: v.string(),
        merchant: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    const ids = [];
    for (const tx of args.transactions) {
      const id = await ctx.db.insert("transactions", {
        ...tx,
        userId,
      });
      ids.push(id);
    }
    return ids;
  },
});

// AI Classification (action — calls external OpenAI API)
export const classify = action({
  args: {
    transactionIds: v.array(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Fetch transactions
    const transactions = [];
    for (const id of args.transactionIds) {
      const tx = await ctx.runQuery(internal.transactions.getById, { id });
      if (tx && tx.userId === identity.subject) {
        transactions.push(tx);
      }
    }

    // Call OpenAI (reuse existing classifier logic)
    const classifications = await classifyTransactions(transactions);

    // Write results back via mutation
    await ctx.runMutation(internal.transactions.applyClassifications, {
      classifications,
    });

    return classifications;
  },
});

// Get summary (income/expenses)
export const getSummary = query({
  args: {
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (q) => {
        let query = q.eq("userId", identity.subject);
        if (args.startDate) query = query.gte("date", args.startDate);
        if (args.endDate) query = query.lte("date", args.endDate);
        return query;
      })
      .collect();

    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { income, expenses, net: income - expenses, count: transactions.length };
  },
});
```

### Analytics Router Migration

**Target (`convex/analytics.ts`):**
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
// Reuse existing calculation functions from packages/features/analytics
import {
  calculate503020,
  calculateSpendingTrends,
  calculateCategoryTotals,
} from "./lib/calculations";

export const get503020 = query({
  args: {
    month: v.float64(),
    year: v.float64(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    // Get transactions for the month
    const startDate = new Date(args.year, args.month - 1, 1).getTime();
    const endDate = new Date(args.year, args.month, 0, 23, 59, 59).getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).gte("date", startDate).lte("date", endDate)
      )
      .collect();

    // Get custom allocation if exists
    const allocation = await ctx.db
      .query("budgetAllocations")
      .withIndex("by_userId_month_year", (q) =>
        q.eq("userId", userId).eq("month", args.month).eq("year", args.year)
      )
      .unique();

    // Reuse existing calculation logic
    return calculate503020(transactions, allocation);
  },
});

export const getSpendingTrends = query({
  args: {
    startDate: v.float64(),
    endDate: v.float64(),
    groupBy: v.union(
      v.literal("day"),
      v.literal("week"),
      v.literal("month")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (q) =>
        q
          .eq("userId", identity.subject)
          .gte("date", args.startDate)
          .lte("date", args.endDate)
      )
      .collect();

    // Reuse existing pure function
    return calculateSpendingTrends(transactions, args.groupBy);
  },
});

export const updateAllocation = mutation({
  args: {
    month: v.float64(),
    year: v.float64(),
    totalIncome: v.float64(),
    needsPercent: v.float64(),
    wantsPercent: v.float64(),
    savingsPercent: v.float64(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject;

    const existing = await ctx.db
      .query("budgetAllocations")
      .withIndex("by_userId_month_year", (q) =>
        q.eq("userId", userId).eq("month", args.month).eq("year", args.year)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalIncome: args.totalIncome,
        needsPercent: args.needsPercent,
        wantsPercent: args.wantsPercent,
        savingsPercent: args.savingsPercent,
      });
      return existing._id;
    }

    return await ctx.db.insert("budgetAllocations", {
      userId,
      ...args,
    });
  },
});
```

### Full Router Mapping

| Current tRPC Procedure | Convex Function | Type |
|------------------------|-----------------|------|
| `auth.getMe` | `users.getMe` | query |
| `transactions.list` | `transactions.list` | query (paginated) |
| `transactions.getById` | `transactions.getById` | query |
| `transactions.create` | `transactions.create` | mutation |
| `transactions.createMany` | `transactions.createMany` | mutation |
| `transactions.update` | `transactions.update` | mutation |
| `transactions.delete` | `transactions.remove` | mutation |
| `transactions.classify` | `transactions.classify` | action (calls OpenAI) |
| `transactions.getSummary` | `transactions.getSummary` | query |
| `analytics.getDateRange` | `analytics.getDateRange` | query |
| `analytics.get503020` | `analytics.get503020` | query |
| `analytics.getSpendingTrends` | `analytics.getSpendingTrends` | query |
| `analytics.getCategoryBreakdown` | `analytics.getCategoryBreakdown` | query |
| `analytics.updateAllocation` | `analytics.updateAllocation` | mutation |
| `analytics.getMonthlyComparison` | `analytics.getMonthlyComparison` | query |

---

## 7. Frontend Integration

### Replace tRPC Client with Convex Client

**Current (`apps/web/src/trpc/provider.tsx`):**
```typescript
// QueryClient + httpBatchLink + SuperJSON transformer
// All components use: trpc.transactions.list.useQuery(...)
```

**Target:**
```typescript
// apps/web/src/app/providers.tsx
"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

### Component Migration Pattern

**Current (tRPC + React Query):**
```typescript
"use client";
import { trpc } from "@/trpc/client";

function TransactionList() {
  const { data, isLoading } = trpc.transactions.list.useQuery({
    limit: 20,
    offset: 0,
  });
  // ...
}
```

**Target (Convex):**
```typescript
"use client";
import { useQuery, usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function TransactionList() {
  // Real-time query — auto-updates when data changes
  const { results, status, loadMore } = usePaginatedQuery(
    api.transactions.list,
    {},
    { initialNumItems: 20 }
  );

  // Mutations
  const createTx = useMutation(api.transactions.create);
  const deleteTx = useMutation(api.transactions.remove);

  // ...
}
```

### Key Frontend Changes

1. **Remove `@trpc/react-query` and `@tanstack/react-query`** — Convex provides its own hooks
2. **Remove `superjson`** — Convex handles serialization natively
3. **Replace `trpc.X.useQuery()`** → `useQuery(api.X, args)`
4. **Replace `trpc.X.useMutation()`** → `useMutation(api.X)`
5. **Pagination** — Switch from offset-based to cursor-based (`usePaginatedQuery`)
6. **Loading states** — `useQuery` returns `undefined` while loading (no `isLoading` boolean); use `result === undefined` check
7. **No manual cache invalidation** — Convex auto-updates all subscribed queries
8. **Remove `QueryClient` staleTime/refetch config** — Not needed with real-time subscriptions

### Server Components

For Server Components (RSC), use `fetchQuery` from the Convex Next.js integration:

```typescript
// apps/web/src/app/(dashboard)/dashboard/page.tsx
import { preloadQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export default async function DashboardPage() {
  const preloaded = await preloadQuery(api.transactions.getSummary, {});

  return <DashboardClient preloadedSummary={preloaded} />;
}
```

---

## 8. External Services

### 8a. AI Classification (OpenAI)

**Current:** `packages/features/transactions/src/classifier.ts` calls OpenAI via Vercel AI SDK in a tRPC mutation.

**Target:** Move to a Convex `action` (actions can call external APIs).

```typescript
// convex/ai.ts
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const classifyTransactions = action({
  args: {
    transactionIds: v.array(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    // 1. Fetch transactions via internal query
    const transactions = await ctx.runQuery(
      internal.transactions.getByIds,
      { ids: args.transactionIds }
    );

    // 2. Call OpenAI (reuse existing classifier logic)
    // The classifyWithAI function from packages/features/transactions
    // can be extracted as a pure utility
    const { generateObject } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: classificationSchema,  // Existing Zod schema → convert to match
      prompt: buildClassificationPrompt(transactions),
    });

    // 3. Write classifications back
    for (const classification of result.object.classifications) {
      await ctx.runMutation(internal.transactions.updateClassification, {
        transactionId: classification.transactionId,
        categoryName: classification.category,
        necessityType: classification.necessityType,
        necessityScore: classification.confidence,
      });
    }

    return result.object.classifications;
  },
});
```

**Key consideration:** The Vercel AI SDK works in Convex actions since they run in a Node.js environment. However, you must install `ai` and `@ai-sdk/openai` as dependencies in the Convex functions environment (via `package.json` in the `convex/` directory or root).

### 8b. Stripe Payments

**Current:** `packages/features/payments/src/` has Stripe utilities but no deployed webhook route.

**Target:** Convex HTTP action for webhooks + actions for API calls.

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Stripe webhook endpoint
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    // Verify and process webhook
    await ctx.runAction(internal.stripe.handleWebhook, {
      body,
      signature,
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

```typescript
// convex/stripe.ts
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const handleWebhook = action({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const event = stripe.webhooks.constructEvent(
      args.body,
      args.signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await ctx.runMutation(internal.subscriptions.upsert, {
          stripeSubscriptionId: sub.id,
          customerId: sub.customer as string,
          status: sub.status,
          // ... map other fields
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await ctx.runMutation(internal.subscriptions.markCanceled, {
          stripeSubscriptionId: sub.id,
        });
        break;
      }
    }
  },
});

export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      client_reference_id: identity.subject,
      subscription_data: { trial_period_days: 14 },
    });

    return { url: session.url };
  },
});
```

### 8c. Email (Resend)

```typescript
// convex/email.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendWelcomeEmail = action({
  args: {
    email: v.string(),
    firstName: v.string(),
  },
  handler: async (ctx, args) => {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: args.email,
      subject: "Welcome to Budget Buddy!",
      // Note: React Email templates need to be rendered to HTML
      // before sending from Convex actions
      html: renderWelcomeEmail({ firstName: args.firstName }),
    });
  },
});
```

---

## 9. Real-Time Features

### Current Behavior (Polling)

```typescript
// React Query: staleTime: 5000, refetchOnWindowFocus: false
// Data updates only when user navigates or manually refreshes
```

### Target Behavior (Real-Time Subscriptions)

Every `useQuery` hook automatically subscribes to changes via WebSocket:

```typescript
// This query auto-updates when ANY transaction for this user changes
const summary = useQuery(api.transactions.getSummary, {
  startDate: monthStart,
  endDate: monthEnd,
});
```

**New real-time capabilities (free with Convex):**

1. **Dashboard stats** — Income/expense totals update instantly when transactions are added
2. **Transaction list** — New transactions appear immediately after CSV import
3. **Budget gauge** — 50/30/20 breakdown updates as transactions are classified
4. **Analytics charts** — Spending trends refresh automatically
5. **Multi-tab sync** — Changes in one tab reflect in all open tabs

### Optimistic Updates

For mutations that need instant UI feedback:

```typescript
const createTx = useMutation(api.transactions.create).withOptimisticUpdate(
  (localStore, args) => {
    const existing = localStore.getQuery(api.transactions.list, {});
    if (existing) {
      localStore.setQuery(api.transactions.list, {}, {
        ...existing,
        page: [{ ...args, _id: "temp", _creationTime: Date.now() }, ...existing.page],
      });
    }
  }
);
```

---

## 10. File Uploads

### CSV Import Flow

**Current:**
1. Client-side file selection → PapaParse → preview in browser
2. Parsed transactions sent to `transactions.createMany` tRPC mutation
3. Auto-classification via `transactions.classify`

**Target:**

The CSV parsing happens client-side (PapaParse in the browser), so the flow is largely unchanged:

1. **Client-side** — File selection → PapaParse → preview (no changes to `transaction-uploader.tsx`)
2. **Upload parsed data** — Call `useMutation(api.transactions.createMany)` instead of tRPC
3. **Classify** — Call `useAction(api.ai.classifyTransactions)` with returned transaction IDs

The `csv-parser.ts` utility stays in `packages/features/transactions/` as a client-side utility. No Convex file storage needed since parsing happens in the browser.

**Alternative (large files):** If CSV files are very large, use Convex file storage:

```typescript
// Upload file to Convex storage
const generateUploadUrl = useMutation(api.files.generateUploadUrl);
const url = await generateUploadUrl();
await fetch(url, { method: "POST", body: file });

// Then process server-side in a Convex action
// (only needed if client-side parsing is insufficient)
```

---

## 11. Rate Limiting

### Current: Redis-backed with in-memory fallback

```typescript
// packages/shared/api/src/rate-limit.ts
// Uses Redis Lua scripts for atomic rate limiting
// Falls back to in-memory Map when Redis unavailable
// Configurations: standard (100/min), strict (10/min), ai (20/min), upload (5/min)
```

### Target: Convex Rate Limiter

Use the `@convex-dev/rate-limiter` package (official Convex component):

```typescript
// convex/rateLimiter.ts
import { RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // AI classification: 20 requests per minute
  aiClassify: { kind: "token bucket", rate: 20, period: 60_000, capacity: 20 },
  // File uploads: 5 per minute
  upload: { kind: "token bucket", rate: 5, period: 60_000, capacity: 5 },
  // Standard API: 100 per minute
  standard: { kind: "token bucket", rate: 100, period: 60_000, capacity: 100 },
  // Strict: 10 per minute
  strict: { kind: "token bucket", rate: 10, period: 60_000, capacity: 10 },
});
```

Usage in functions:

```typescript
export const classify = action({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Rate limit check
    const { ok } = await rateLimiter.limit(ctx, "aiClassify", {
      key: identity.subject,
    });
    if (!ok) throw new Error("Rate limit exceeded");

    // ... proceed with classification
  },
});
```

**Benefits over current approach:**
- No Redis infrastructure needed
- No in-memory fallback complexity
- Atomic and distributed by default
- Simpler configuration

---

## 12. Testing Strategy

### Unit Tests (Keep & Adapt)

The existing 45 unit tests in `packages/features/` test pure business logic:

- `csv-parser.test.ts` (30+ tests) — **No changes needed** (tests pure parsing functions)
- `calculations.test.ts` (26+ tests) — **No changes needed** (tests pure calculation functions)

These tests remain valid because they test utility functions, not database operations.

### Integration Tests (Rewrite)

For testing Convex functions, use the Convex test framework:

```typescript
// convex/transactions.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("create and list transactions", async () => {
  const t = convexTest(schema);

  // Set up authenticated user
  const asUser = t.withIdentity({ subject: "user_123", email: "test@test.com" });

  // Create a transaction
  await asUser.mutation(api.transactions.create, {
    amount: -50.0,
    date: Date.now(),
    description: "Test purchase",
  });

  // Query transactions
  const result = await asUser.query(api.transactions.list, {
    paginationOpts: { numItems: 10, cursor: null },
  });

  expect(result.page).toHaveLength(1);
  expect(result.page[0].amount).toBe(-50.0);
});
```

### E2E Tests (Minimal Changes)

Playwright tests test the UI, not the backend directly. They should work with minimal changes once the frontend integration is updated. The main change is ensuring the Convex dev server is running instead of PostgreSQL.

---

## 13. Data Migration

### Strategy: Export → Transform → Import

For existing PostgreSQL data (if any), use a one-time migration script:

**Step 1: Export from PostgreSQL**

```bash
# Using the existing export feature or direct SQL
pnpm db:studio  # Export tables as JSON
```

**Step 2: Transform & Import to Convex**

```typescript
// scripts/migrate-to-convex.ts
// Run with: npx convex run scripts/migrate

import { mutation } from "./_generated/server";

// Import users
export const migrateUsers = mutation({
  handler: async (ctx) => {
    const users = await fetchFromPostgres("users");

    for (const user of users) {
      await ctx.db.insert("users", {
        clerkId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        imageUrl: user.image_url,
      });
    }
  },
});

// Import transactions (batch to avoid timeout)
export const migrateTransactions = mutation({
  args: { batch: v.float64() },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 100;
    const transactions = await fetchFromPostgres(
      "transactions",
      BATCH_SIZE,
      args.batch * BATCH_SIZE
    );

    for (const tx of transactions) {
      await ctx.db.insert("transactions", {
        userId: tx.user_id,
        amount: tx.amount,
        date: new Date(tx.date).getTime(),
        description: tx.description,
        merchant: tx.merchant,
        necessityScore: tx.necessity_score,
        aiClassified: tx.ai_classified,
        notes: tx.notes,
      });
    }
  },
});
```

### Key Transformation Rules

| PostgreSQL | Convex |
|-----------|--------|
| UUID primary keys | Auto-generated `_id` |
| `timestamp` | `number` (ms since epoch) |
| FK references (text ID) | `v.id("table")` or `v.string()` |
| `createdAt` | `_creationTime` (automatic) |
| `NULL` | `undefined` (omit field) |
| SQL `DEFAULT` | Set in mutation handler |

---

## 14. Monorepo Adjustments

### Package Changes

| Package | Action |
|---------|--------|
| `packages/shared/db/` | **Remove** — Replaced by `convex/schema.ts` |
| `packages/shared/api/` | **Remove** — tRPC + rate limiting replaced by Convex |
| `packages/features/*/router.ts` | **Remove** — Logic moves to `convex/*.ts` |
| `packages/features/*/src/` (components, utils) | **Keep** — UI components and pure utilities unchanged |
| `apps/web/src/trpc/` | **Remove** — Replaced by Convex client |
| `apps/web/src/server/` | **Remove** — tRPC server setup no longer needed |
| `apps/web/src/app/api/trpc/` | **Remove** — No API route needed |

### New Dependencies

Add to `pnpm-workspace.yaml` catalog:

```yaml
catalog:
  # Convex
  convex: "^1.17.0"         # Core Convex SDK
  convex-test: "^0.0.34"    # Testing utilities
  "@convex-dev/rate-limiter": "^0.1.0"  # Rate limiting component
```

Remove from catalog:
```yaml
  # Remove these
  drizzle-orm: ...
  postgres: ...
  ioredis: ...
  "@trpc/client": ...
  "@trpc/react-query": ...
  "@trpc/server": ...
  "@tanstack/react-query": ...
  superjson: ...
  drizzle-kit: ...
```

### Turbo Configuration Updates

```jsonc
// turbo.json — remove db tasks, keep others
{
  "tasks": {
    // Remove: db:generate, db:push, db:studio, db:migrate
    // Add:
    "convex:dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### New Scripts

```jsonc
// package.json
{
  "scripts": {
    // Remove: db:generate, db:push, db:studio, db:migrate, infra:up, infra:down
    // Add:
    "convex:dev": "npx convex dev",
    "convex:deploy": "npx convex deploy"
  }
}
```

### Convex Directory Placement

The `convex/` directory should live at the **monorepo root** (alongside `apps/` and `packages/`). Configure this in `convex.json`:

```json
{
  "functions": "convex/"
}
```

If Convex functions need to import from feature packages (e.g., reusing `calculations.ts`), configure the Convex bundler to resolve workspace packages:

```json
// convex/package.json (if needed)
{
  "dependencies": {
    "@finance/transactions": "workspace:*",
    "@finance/analytics": "workspace:*"
  }
}
```

Alternatively, extract pure utility functions into a shared location that both Convex functions and feature packages can import.

---

## 15. Migration Phases

### Phase 0: Preparation (1-2 days)

- [ ] Set up Convex project (`npx convex init`)
- [ ] Add Convex dependencies to workspace catalog
- [ ] Configure Clerk JWT template for Convex
- [ ] Set environment variables (`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`)
- [ ] Create `convex/schema.ts` with full document schema
- [ ] Create `convex/auth.config.ts` for Clerk
- [ ] Verify schema deploys to Convex Cloud

### Phase 1: Core Backend (3-5 days)

- [ ] Implement `convex/users.ts` — user queries + Clerk webhook sync
- [ ] Implement `convex/categories.ts` — CRUD + system category seeding
- [ ] Implement `convex/transactions.ts` — full CRUD + pagination + filters
- [ ] Implement `convex/analytics.ts` — 50/30/20, trends, breakdowns
- [ ] Implement `convex/budgets.ts` — budget + allocation management
- [ ] Extract pure calculation functions to shared location for reuse
- [ ] Implement `convex/http.ts` — Clerk webhook route
- [ ] Write integration tests using `convex-test`

### Phase 2: External Integrations (2-3 days)

- [ ] Implement `convex/ai.ts` — OpenAI classification action
- [ ] Implement `convex/stripe.ts` — checkout, billing portal, webhook handler
- [ ] Implement `convex/subscriptions.ts` — subscription management
- [ ] Implement `convex/email.ts` — Resend email actions
- [ ] Add Stripe webhook route to `convex/http.ts`
- [ ] Set up rate limiting with `@convex-dev/rate-limiter`

### Phase 3: Frontend Migration (3-5 days)

- [ ] Replace tRPC provider with ConvexProviderWithClerk
- [ ] Migrate dashboard page components to use `useQuery`/`useMutation`
- [ ] Migrate transaction list/table to `usePaginatedQuery`
- [ ] Migrate analytics pages to Convex queries
- [ ] Migrate import flow to Convex mutations + actions
- [ ] Migrate settings/subscription pages
- [ ] Remove all tRPC imports and React Query usage
- [ ] Add optimistic updates for key mutations

### Phase 4: Cleanup & Testing (2-3 days)

- [ ] Remove `packages/shared/db/` (Drizzle schema + client)
- [ ] Remove `packages/shared/api/` (tRPC builder + rate limiting)
- [ ] Remove tRPC router files from feature packages
- [ ] Remove `apps/web/src/trpc/`, `apps/web/src/server/`, `apps/web/src/app/api/trpc/`
- [ ] Remove Docker infrastructure (PostgreSQL, Redis) — `docker-compose.yml`, scripts
- [ ] Remove unused dependencies from workspace catalog
- [ ] Update turbo.json (remove db tasks, add convex tasks)
- [ ] Update all package.json files
- [ ] Run full test suite (unit + integration + E2E)
- [ ] Update CLAUDE.md with new architecture docs
- [ ] Update environment variable documentation

### Phase 5: Data Migration (if needed) (1 day)

- [ ] Export existing PostgreSQL data
- [ ] Run transformation scripts
- [ ] Import to Convex
- [ ] Verify data integrity

### Total Estimated Effort: 12-18 days

---

## 16. Risk Assessment

### High Risk

| Risk | Mitigation |
|------|------------|
| **Convex document size limits** | Convex documents have a 1MB limit. Transactions are small (~500 bytes each), so this is not a concern. Bulk operations may need batching. |
| **Pagination model change** | Current UI uses offset-based pagination; Convex uses cursor-based. UI components need updating. |
| **Action execution time** | Convex actions have a 10-minute timeout. AI classification of large batches (100+ transactions) should be chunked. |
| **Vendor lock-in** | Convex is a proprietary backend. Mitigate by keeping business logic in pure functions that don't depend on Convex APIs. |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| **Query performance** | Convex doesn't support arbitrary SQL. Complex analytics queries may need restructuring. Use indexes strategically. |
| **No SQL aggregations** | `SUM`, `AVG`, `GROUP BY` must be done in JavaScript. For large datasets, consider materialized aggregations. |
| **Missing `JOIN` support** | Related data (transaction + category) requires multiple queries or denormalization. |
| **Bundle size** | Convex client adds ~30KB. Remove tRPC + React Query (~50KB) to offset. |

### Low Risk

| Risk | Mitigation |
|------|------------|
| **Clerk integration** | Convex has first-class Clerk support. Well-documented. |
| **Stripe webhooks** | HTTP actions are straightforward. Existing webhook logic transfers directly. |
| **Testing** | `convex-test` supports Vitest. Pure function tests need zero changes. |
| **Real-time bugs** | Convex subscriptions are battle-tested. May need UI adjustments for rapid updates. |

---

## 17. Rollback Strategy

### During Migration (Parallel Running)

During Phases 1-3, keep the existing tRPC + Drizzle stack fully functional:

1. **Don't delete existing code** until Phase 4
2. **Feature flag** — Use an environment variable `USE_CONVEX=true|false` to toggle between backends during development
3. **Test both paths** — Run E2E tests against both backends

### After Migration

If issues are found post-migration:

1. The old code exists in git history and can be restored
2. Docker infrastructure scripts can be re-enabled
3. Database schema and migrations are preserved in git

### Point of No Return

The migration is reversible until:
- PostgreSQL data is deleted
- DNS/webhook URLs are permanently switched to Convex endpoints
- Old packages are removed from `node_modules`

**Recommendation:** Keep PostgreSQL running in read-only mode for 2 weeks after full Convex switchover, as a safety net.

---

## Appendix A: Environment Variables (New)

```bash
# Convex (new)
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk (unchanged, add JWT issuer for Convex)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-instance.clerk.accounts.dev

# External services (unchanged)
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...

# Removed
# DATABASE_URL (no longer needed)
# REDIS_URL (no longer needed)
```

## Appendix B: File Inventory — Delete After Migration

```
# Packages to remove entirely
packages/shared/db/                    # Drizzle schema, client, migrations
packages/shared/api/                   # tRPC builder, rate limiting, Redis

# Files to remove from feature packages
packages/features/transactions/src/router.ts
packages/features/analytics/src/router.ts
packages/features/auth/src/router.ts
packages/features/auth/src/sync-user.ts
packages/features/auth/src/server.ts

# Files to remove from web app
apps/web/src/trpc/                     # tRPC client, provider, server
apps/web/src/server/                   # tRPC server routers
apps/web/src/app/api/trpc/            # API route handler

# Infrastructure to remove
docker-compose.yml
docker-compose.debug.yml
scripts/infra-up.sh
scripts/infra-down.sh
scripts/infra-debug.sh
```

## Appendix C: Files to Keep (Reusable Business Logic)

```
# Pure utility functions — no database dependency
packages/features/transactions/src/csv-parser.ts       # CSV parsing logic
packages/features/transactions/src/csv-parser.test.ts  # Tests
packages/features/transactions/src/classifier.ts       # AI prompt building (extract)
packages/features/transactions/src/export.ts           # Export formatting (adapt)
packages/features/transactions/src/schema.ts           # Zod schemas (for client validation)

packages/features/analytics/src/calculations.ts        # 50/30/20, trends, totals
packages/features/analytics/src/calculations.test.ts   # Tests

packages/features/payments/src/plans.ts                # Pricing config
packages/features/payments/src/stripe-client.ts        # Stripe init (move to convex/)

# All UI components — unchanged
packages/features/*/src/*.tsx
packages/shared/ui/

# All config — unchanged
packages/shared/config/
packages/shared/logger/
packages/shared/email/src/templates/   # Email templates (render before sending)
```
