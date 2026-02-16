# Open Banking Integration Plan

## Goal

Replace manual CSV import with automatic bank account connection and transaction syncing using Open Banking APIs, focused on UK banks. Open banking is a **Pro-only** feature to cover Plaid costs, while CSV import remains free.

---

## Provider: Plaid

After researching TrueLayer, Plaid, Yapily, GoCardless (Nordigen), Salt Edge, and Finexer, **Plaid** is the recommended provider.

### Why Plaid

| Criteria                 | Plaid                                                | TrueLayer                             | Yapily                             |
| ------------------------ | ---------------------------------------------------- | ------------------------------------- | ---------------------------------- |
| **UK bank coverage**     | Major UK banks via Open Banking                      | ~98% UK banks                         | ~2,000 banks across 19 countries   |
| **Node.js SDK**          | Official `plaid` npm (MIT, 363k weekly downloads)    | Deprecated JS client; raw REST only   | JS SDK exists but not TS-native    |
| **React component**      | Official `react-plaid-link` with `usePlaidLink` hook | `truelayer-web-sdk` for payments only | No React component                 |
| **Data API**             | Core strength — transactions, balances, identity     | Data API is add-on to payments        | Core offering but JS SDK is weaker |
| **Developer experience** | Best-in-class: sandbox, quickstarts, typed SDK       | Good docs but deprecated Node SDK     | Decent docs, sandbox available     |

### Why not the others

- **TrueLayer**: Deprecated Node.js SDK. Data API is add-on to payments.
- **Yapily**: Node.js SDK isn't TypeScript-native. Enterprise-focused pricing.
- **GoCardless (Nordigen)**: No longer accepting new customers for Bank Account Data API (Sept 2025).
- **Salt Edge / Finexer**: Smaller ecosystems, less community support.

---

## Tier System

### Pricing Plans

| Feature                | Free  | Pro ($7.99/mo) | Pro Yearly ($79.99/yr) |
| ---------------------- | ----- | -------------- | ---------------------- |
| **CSV Import**         | Yes   | Yes            | Yes                    |
| **Open Banking**       | No    | Yes            | Yes                    |
| **Bank Connections**   | 0     | 5              | 10                     |
| **AI Classification**  | 5/min | 50/min         | 50/min                 |
| **CSV Upload**         | 3/min | 15/min         | 15/min                 |
| **Transactions/month** | 100   | Unlimited      | Unlimited              |

### Implementation

- **Tier-aware rate limiting** via tRPC middleware reads `userPlan` from context
- **Context creation** looks up user's active subscription from the `subscriptions` table
- **Pro-gated procedures** use `proProcedure` middleware that checks `openBankingEnabled`
- **Connection limits** enforced in `exchangeToken` procedure before storing new connections

---

## Architecture

### New package: `@finance/banking`

```
packages/features/banking/
├── src/
│   ├── index.ts                    # Client exports (schema, components)
│   ├── server.ts                   # Server exports (router, sync, plaid client)
│   ├── router.ts                   # tRPC router (8 procedures)
│   ├── plaid-client.ts             # Plaid SDK client setup
│   ├── sync.ts                     # Transaction sync logic (cursor-based)
│   ├── schema.ts                   # Zod validation schemas
│   ├── mappers.ts                  # Plaid → app transaction mapping
│   └── components/
│       ├── connect-bank.tsx        # PlaidLink wrapper button
│       ├── connected-accounts.tsx  # Bank account list with actions
│       └── sync-status.tsx         # Sync progress/result indicator
├── package.json
├── tsconfig.json
└── turbo.json
```

### Database schema

#### New `bank_connections` table

| Column             | Type        | Description                               |
| ------------------ | ----------- | ----------------------------------------- |
| `id`               | uuid        | Primary key                               |
| `userId`           | text FK     | References users.id (cascade delete)      |
| `plaidItemId`      | text unique | Plaid's item identifier                   |
| `plaidAccessToken` | text        | Access token for API calls                |
| `institutionId`    | text        | Bank identifier                           |
| `institutionName`  | text        | Human-readable bank name                  |
| `accountIds`       | jsonb       | Array of connected account IDs            |
| `status`           | text        | "active" / "error" / "requires_reauth"    |
| `lastSyncedAt`     | timestamp   | Last successful sync                      |
| `consentExpiresAt` | timestamp   | PSD2 90-day consent expiry                |
| `cursor`           | text        | Plaid sync cursor for incremental updates |
| `createdAt`        | timestamp   | Created at                                |
| `updatedAt`        | timestamp   | Updated at                                |

#### Transactions table additions

| Column             | Type               | Description                            |
| ------------------ | ------------------ | -------------------------------------- |
| `bankConnectionId` | text FK (nullable) | References bank_connections.id         |
| `externalId`       | text (nullable)    | Plaid transaction ID for deduplication |
| `source`           | text               | "csv" / "open_banking" / "manual"      |

### tRPC Router Procedures

| Procedure               | Auth | Description                              |
| ----------------------- | ---- | ---------------------------------------- |
| `createLinkToken`       | Pro  | Create Plaid Link token (country: GB)    |
| `exchangeToken`         | Pro  | Exchange public token, store connection  |
| `listConnections`       | Auth | List user's bank connections             |
| `getConnectionStatus`   | Auth | Check connection health + consent expiry |
| `removeConnection`      | Pro  | Revoke Plaid access + delete record      |
| `syncTransactions`      | Pro  | Sync one connection (cursor-based)       |
| `syncAll`               | Pro  | Sync all active connections              |
| `createUpdateLinkToken` | Pro  | Re-auth link token for expired consent   |

### Tier-Aware Rate Limiting

**Changes to `@finance/api`:**

- `Context` extended with `userPlan?: "free" | "pro" | "pro-yearly"`
- New `tier-limits.ts` defines per-plan rate limits and feature gates
- `tieredAiRateLimitedProcedure` — free: 5/min, pro: 50/min
- `tieredUploadRateLimitedProcedure` — free: 3/min, pro: 15/min
- `proProcedure` — enforces active pro subscription for open banking

**Context creation** (`apps/web/src/server/trpc.ts`):

- Looks up most recent active/trialing subscription for the user
- Sets `userPlan` in context (defaults to "free")

### Plaid Category Mapping

Plaid transactions include `personal_finance_category` with primary categories that map to the app's 16 categories:

| Plaid Category      | App Category     | Necessity |
| ------------------- | ---------------- | --------- |
| INCOME              | Income           | savings   |
| RENT_AND_UTILITIES  | Housing          | need      |
| TRANSPORTATION      | Transportation   | need      |
| FOOD_AND_DRINK      | Food & Groceries | need      |
| MEDICAL             | Healthcare       | need      |
| ENTERTAINMENT       | Entertainment    | want      |
| GENERAL_MERCHANDISE | Shopping         | want      |
| TRAVEL              | Travel           | want      |
| BANK_FEES           | Fees & Interest  | need      |

This reduces AI classification calls — Plaid's enriched categories cover most transactions.

---

## Remaining Work (Future)

These items are planned but not yet implemented:

### Dashboard Pages

- Add "Connect Bank" page at `/dashboard/connect`
- Update import page with open banking option alongside CSV
- Add source indicator to transaction list
- Add connected accounts summary to dashboard overview

### Plaid Webhooks

- Add webhook endpoint at `apps/web/src/app/api/webhooks/plaid/route.ts`
- Handle `SYNC_UPDATES_AVAILABLE`, `ITEM_LOGIN_REQUIRED`, `TRANSACTIONS_REMOVED`
- Verify webhook signatures

### Access Token Encryption

- Encrypt Plaid access tokens at rest using AES-256-GCM
- Store encryption key as environment variable

---

## UK-Specific Notes

- Uses `country_codes: ['GB']` for all Plaid Link tokens
- UK banks use OAuth flows — Plaid Link handles this automatically
- PSD2 mandates re-consent every 90 days (tracked via `consentExpiresAt`)
- Supported UK banks: Barclays, HSBC, Lloyds, NatWest, Santander, Halifax, Nationwide, Monzo, Starling, Revolut

---

## Environment Variables

```env
PLAID_CLIENT_ID=             # From Plaid dashboard
PLAID_SECRET=                # From Plaid dashboard
PLAID_ENV=sandbox            # sandbox | production
PLAID_WEBHOOK_URL=           # Your webhook endpoint URL
PLAID_REDIRECT_URI=          # OAuth redirect URI for UK banks
```

---

## Sources

- [Plaid Node.js SDK (npm)](https://www.npmjs.com/package/plaid)
- [Plaid GitHub](https://github.com/plaid/plaid-node)
- [react-plaid-link](https://www.npmjs.com/package/react-plaid-link)
- [Plaid Quickstart Docs](https://plaid.com/docs/quickstart/)
- [Plaid UK/EU Pricing](https://plaid.com/en-eu/pricing/)
- [TrueLayer vs Plaid vs Yapily](https://blog.finexer.com/comparing-open-banking-providers-a-guide-for-business/)
- [UK Open Banking](https://www.openbanking.org.uk/)
