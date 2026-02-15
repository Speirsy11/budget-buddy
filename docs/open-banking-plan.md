# Open Banking Integration Plan

## Goal

Replace manual CSV import with automatic bank account connection and transaction syncing using Open Banking APIs, focused on UK banks.

---

## Provider Recommendation: Plaid

After researching TrueLayer, Plaid, Yapily, GoCardless (Nordigen), Salt Edge, and Finexer, **Plaid** is the recommended provider for this project.

### Why Plaid

| Criteria | Plaid | TrueLayer | Yapily |
|---|---|---|---|
| **UK bank coverage** | Major UK banks via Open Banking | ~98% UK banks | ~2,000 banks across 19 countries |
| **Node.js SDK** | Official `plaid` npm package (MIT, 363k weekly downloads, monthly updates) | Deprecated JS client; must use raw REST | JS SDK exists but not TypeScript-native |
| **React component** | Official `react-plaid-link` with `usePlaidLink` hook, Next.js quickstart | `truelayer-web-sdk` for payments only | No React component |
| **Data API** | Core strength — transactions, balances, identity, auth | Data API is add-on to payments product | Core offering but JS SDK is weaker |
| **Developer experience** | Best-in-class: sandbox, quickstarts, Plaid Academy, typed SDK | Good docs but deprecated Node SDK is a concern | Decent docs, sandbox available |
| **Pricing** | Pay-as-you-go from ~$0.30-1.00/connection; custom for UK | Custom/enterprise only, no public pricing | Custom only, no public pricing |
| **Multi-region** | US, Canada, 16 EU countries + UK | Europe-focused | Europe-focused (19 countries) |

### Why not the others

- **TrueLayer**: Their Node.js SDK is deprecated. Their Data API is an add-on to payments, not a standalone product. Would need raw HTTP calls for everything.
- **Yapily**: Good infrastructure but their Node.js SDK isn't TypeScript-native. More developer effort required. Enterprise-focused pricing.
- **GoCardless (Nordigen)**: Was the best free option, but as of Sept 2025 they are reportedly no longer accepting new customers for the Bank Account Data API.
- **Salt Edge / Finexer**: Smaller ecosystems, fewer developer resources, less community support.

### Alternative worth considering

If cost is a primary concern, **TrueLayer** is worth a second look — despite the deprecated SDK, their REST API is well-documented and their UK coverage is excellent. The trade-off is more boilerplate code for API calls.

---

## Architecture

### New package

```
packages/features/banking/          # New feature package
├── src/
│   ├── index.ts                    # Public exports
│   ├── router.ts                   # tRPC router for banking operations
│   ├── plaid-client.ts             # Plaid SDK client setup
│   ├── sync.ts                     # Transaction sync logic
│   ├── schema.ts                   # Zod schemas for banking inputs
│   ├── mappers.ts                  # Map Plaid transactions → app transactions
│   └── components/
│       ├── connect-bank.tsx        # PlaidLink wrapper component
│       ├── connected-accounts.tsx  # Show linked bank accounts
│       └── sync-status.tsx         # Show sync progress/status
├── package.json
└── tsconfig.json
```

### Database schema additions

```
packages/shared/db/src/schema/
├── bank-connections.ts             # New table
└── transactions.ts                 # Add bankConnectionId FK
```

#### New `bankConnections` table

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `userId` | text | FK → users |
| `plaidItemId` | text | Plaid's item identifier |
| `plaidAccessToken` | text | Encrypted access token for API calls |
| `institutionId` | text | Bank identifier (e.g., "ins_12345") |
| `institutionName` | text | Human-readable bank name |
| `accountIds` | jsonb | Array of connected account IDs with metadata |
| `status` | enum | "active", "error", "requires_reauth" |
| `lastSyncedAt` | timestamp | Last successful transaction sync |
| `consentExpiresAt` | timestamp | Open Banking consent expiry (90 days under PSD2) |
| `cursor` | text | Plaid sync cursor for incremental updates |
| `createdAt` | timestamp | When the connection was created |
| `updatedAt` | timestamp | Last updated |

#### Transactions table changes

Add to existing `transactions` table:

| Column | Type | Description |
|---|---|---|
| `bankConnectionId` | uuid (nullable) | FK → bankConnections (null for CSV imports) |
| `externalId` | text (nullable) | Plaid transaction ID for deduplication |
| `source` | enum | "csv", "open_banking", "manual" |

---

## Implementation Plan

### Phase 1: Foundation (Plaid client + DB schema)

1. **Add dependencies to workspace catalog** (`pnpm-workspace.yaml`)
   - `plaid` (Node.js SDK)
   - `react-plaid-link` (React hook for Plaid Link)

2. **Create `packages/features/banking/` package**
   - Set up package.json, tsconfig.json
   - Create `plaid-client.ts` — initialise `PlaidApi` with configuration for sandbox/production, UK country code

3. **Add database schema**
   - Create `bankConnections` table in `packages/shared/db/src/schema/`
   - Add `bankConnectionId`, `externalId`, `source` columns to transactions table
   - Add relations between bankConnections ↔ users, bankConnections ↔ transactions
   - Generate and apply migration

4. **Add environment variables**
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENV` (sandbox | production)

### Phase 2: Bank Connection Flow

5. **Create tRPC router** (`packages/features/banking/src/router.ts`)

   Procedures:
   - `createLinkToken` — calls `plaid.linkTokenCreate()` with `country_codes: ['GB']`, products: `['transactions']`, returns token to frontend
   - `exchangePublicToken` — receives public token from Plaid Link, exchanges for access token, stores encrypted bank connection
   - `listConnections` — returns user's connected bank accounts with status
   - `removeConnection` — disconnects a bank account (calls `plaid.itemRemove()`, deletes DB record)
   - `getConnectionStatus` — check if a connection needs re-authentication

6. **Create React components**
   - `ConnectBank` — wraps `usePlaidLink` hook, handles success/error callbacks, "Connect your bank" button
   - `ConnectedAccounts` — lists connected banks with status badges, disconnect button, last synced timestamp
   - `SyncStatus` — shows sync progress indicator

7. **Register router** — add banking router to main tRPC app router

### Phase 3: Transaction Syncing

8. **Build transaction sync logic** (`sync.ts`)
   - Use Plaid's `/transactions/sync` endpoint (cursor-based incremental sync)
   - Map Plaid transaction fields to app's `ParsedTransaction` format
   - Handle added/modified/removed transactions
   - Deduplicate using `externalId` (Plaid's `transaction_id`)
   - Auto-classify new transactions using existing AI classifier

9. **Create transaction mapper** (`mappers.ts`)
   - Map Plaid's `Transaction` type → app's transaction schema
   - Handle Plaid's merchant info, category hints, amount sign conventions
   - Extract merchant name from Plaid's enriched data
   - Map Plaid's category to app's category system where possible (reduce AI calls)

10. **Add sync tRPC procedures**
    - `syncTransactions` — trigger manual sync for a specific connection
    - `syncAll` — sync all active connections for the user

### Phase 4: Dashboard Integration

11. **Add "Connect Bank" page** at `/dashboard/connect`
    - Plaid Link integration
    - List of connected accounts
    - Connection status and health
    - "Sync now" button

12. **Update import page** at `/dashboard/import`
    - Add open banking option alongside CSV import
    - Show connected accounts with quick-sync action
    - Keep CSV as fallback option

13. **Update transaction list**
    - Add source indicator (bank icon for open banking, file icon for CSV)
    - Filter by source
    - Show which bank account a transaction came from

14. **Update dashboard overview**
    - Show connected accounts summary
    - "Last synced" indicator
    - Alert when re-authentication is needed (PSD2 90-day consent)

### Phase 5: Consent Management & Re-auth

15. **PSD2 consent handling**
    - Track 90-day consent expiry per connection
    - Show warning when consent is expiring soon (e.g., 7 days before)
    - Implement re-authentication flow using Plaid Link in update mode
    - Handle Plaid webhook `ITEM_LOGIN_REQUIRED` for broken connections

16. **Add Plaid webhook endpoint** (`apps/web/src/app/api/webhooks/plaid/route.ts`)
    - Verify webhook signature
    - Handle events:
      - `SYNC_UPDATES_AVAILABLE` — trigger background sync
      - `ITEM_LOGIN_REQUIRED` — mark connection as needing re-auth
      - `TRANSACTIONS_REMOVED` — handle removed transactions
    - Rate limit webhook processing

---

## Security Considerations

- **Access token encryption**: Plaid access tokens must be encrypted at rest in the database (use AES-256-GCM with a server-side key)
- **Token handling**: Access tokens never leave the server; only link tokens are sent to the client
- **Webhook verification**: Verify Plaid webhook signatures before processing
- **Scope limitation**: Only request `transactions` product scope (not payments, identity, etc.)
- **PSD2 compliance**: Respect 90-day consent windows, prompt for re-auth
- **Data minimisation**: Only store transaction data the app needs, don't cache raw Plaid responses

---

## UK-Specific Notes

- Use `country_codes: ['GB']` when creating link tokens
- UK banks use OAuth flows — Plaid Link handles this, but you need a registered `redirect_uri`
- PSD2 mandates Strong Customer Authentication (SCA) for initial consent and re-consent every 90 days
- Plaid supports major UK banks: Barclays, HSBC, Lloyds, NatWest, Santander, Halifax, Nationwide, Monzo, Starling, Revolut, and more
- Plaid's UK coverage aligns well with the banks already supported in the CSV parser

---

## Environment Variables to Add

```env
# Plaid
PLAID_CLIENT_ID=             # From Plaid dashboard
PLAID_SECRET=                # From Plaid dashboard
PLAID_ENV=sandbox            # sandbox | production
PLAID_WEBHOOK_URL=           # Your webhook endpoint URL
PLAID_REDIRECT_URI=          # OAuth redirect URI for UK banks
```

---

## Effort Breakdown

| Phase | Description |
|---|---|
| Phase 1 | Foundation — Plaid client, DB schema, env vars |
| Phase 2 | Bank connection flow — Link, token exchange, account listing |
| Phase 3 | Transaction syncing — incremental sync, mapping, dedup, AI classify |
| Phase 4 | Dashboard integration — new pages, updated UI |
| Phase 5 | Consent management — PSD2 re-auth, webhooks |

---

## Testing Strategy

- **Unit tests**: Transaction mappers, sync logic, deduplication
- **Integration tests**: Plaid client with sandbox environment
- **E2E tests**: Full connect → sync → view flow using Plaid sandbox credentials
- **Manual testing**: Test with Plaid sandbox institutions that simulate UK bank behaviour

---

## Sources

- [Plaid Node.js SDK (npm)](https://www.npmjs.com/package/plaid)
- [Plaid GitHub](https://github.com/plaid/plaid-node)
- [react-plaid-link](https://www.npmjs.com/package/react-plaid-link)
- [Plaid Tiny Quickstart (Next.js)](https://github.com/plaid/tiny-quickstart)
- [Plaid UK/EU Pricing](https://plaid.com/en-eu/pricing/)
- [Plaid Quickstart Docs](https://plaid.com/docs/quickstart/)
- [Top 12 UK Open Banking Providers](https://blog.finexer.com/top-12-open-banking-providers/)
- [TrueLayer vs Plaid vs Yapily Comparison](https://blog.finexer.com/comparing-open-banking-providers-a-guide-for-business/)
- [Yapily Node.js SDK](https://github.com/yapily/yapily-sdk-nodejs)
- [TrueLayer Data API](https://docs.truelayer.com/docs/data-api-basics)
- [GoCardless Bank Account Data](https://developer.gocardless.com/bank-account-data/overview)
- [UK Open Banking](https://www.openbanking.org.uk/)
