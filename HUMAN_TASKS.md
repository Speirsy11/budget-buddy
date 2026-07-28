# Human Tasks

Work that requires account access, credentials, or billing decisions — things an agent
cannot (and should not) do on your behalf. Everything else is handled in code.

Each task lists what to do, where the value goes, and how to verify it worked.

---

## 1. Clerk — claim the keyless instance (do this first)

**Why it matters:** The keys currently in `.env` are Clerk _keyless_ (temporary) keys.
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` decodes to `intense-wallaby-61.clerk.accounts.dev`,
which is a throwaway instance Clerk provisioned automatically. If it expires you get a new
user ID, and your existing data in Postgres (keyed by Clerk user ID) is orphaned.

**Steps:**

1. Visit the Clerk dashboard and claim the `intense-wallaby-61` instance, or create a fresh
   application.
2. Copy the real `pk_live_…` / `sk_live_…` (or `pk_test_…` for a dev instance) values.
3. Update **both** files — they are separate and both are read:
   - `.env` (root — used by `pnpm db:seed` and Playwright)
   - `apps/web/.env.local` (used by the Next.js app)
4. If your Clerk user ID changes, re-point existing data:
   ```sql
   UPDATE users SET id = '<new_clerk_id>' WHERE email = '<your_account_email>';
   ```
   (Cascades to transactions, budgets, goals, accounts via FK.)

**Verify:** Sign in and confirm the URL is your own Clerk domain, not `*.accounts.dev`,
and that the dashboard still shows your transactions.

---

## 2. OpenAI — AI transaction classification

**Why it matters:** Without a key, CSV import still works but every transaction lands
uncategorised. The rules engine (see `packages/features/transactions/src/rules.ts`) now
catches most common merchants deterministically, so AI is the fallback for the long tail
rather than the primary path — but the long tail is where it earns its keep.

**Steps:**

1. Create an API key at the OpenAI platform.
2. Set in `apps/web/.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   MOCK_FUNCTIONALITY=false
   ```

**No key yet?** Set `MOCK_FUNCTIONALITY=true` instead. Classification returns deterministic
stub results so you can exercise the full import flow without spending anything.

**Verify:** Import a CSV; transactions should arrive categorised. Check the dev server log
for `createMany: AI classification completed`.

---

## 3. Stripe — billing

**Why it matters:** The settings page calls `payments.status` and `payments.createPortal`.
Both fail without keys. The billing panel degrades to a "free" plan display.

**Steps:**

1. Create a Stripe account; stay in **test mode** while evaluating.
2. Create one product with two prices: monthly and yearly.
3. Collect: secret key, publishable key, both price IDs.
4. Set in `apps/web/.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_PRO_MONTHLY_PRICE_ID=price_...
   STRIPE_PRO_YEARLY_PRICE_ID=price_...
   APP_URL=http://localhost:3001
   ```
5. For webhooks locally, run the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
   Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

**Note:** `APP_URL` must match the port you actually run on. Port 3000 is occupied by
AdGuard Home on this machine, so the web app falls back to 3001.

**Verify:** Settings → "Manage billing" should open the Stripe portal. Trigger a test
webhook and confirm a row appears in the `subscriptions` table.

---

## 4. Plaid — open banking

**Why it matters:** `/dashboard/open-banking` throws `Plaid credentials not configured`
on first click without these.

**Steps:**

1. Request Plaid sandbox access and create an app.
2. Set in `apps/web/.env.local`:
   ```
   PLAID_CLIENT_ID=...
   PLAID_SECRET=...
   PLAID_ENV=sandbox
   ```
3. Sandbox test credentials are `user_good` / `pass_good`.

**Note:** UK bank coverage requires Plaid's production tier and a compliance review —
sandbox is fine for evaluating the flow, but real UK account linking is a longer process.
CSV import is the practical path for daily use until then.

**Verify:** Open banking page → link a sandbox institution → transactions sync in.

---

## 5. Resend — email notifications

**Why it matters:** Email is now wired to real triggers (welcome on signup, budget alerts
on threshold breach, weekly summary). Without a key, every send is skipped with a logged
warning — the app works, but no mail leaves.

**Steps:**

1. Create a Resend account and API key.
2. Verify a sending domain (required for anything other than Resend's test address).
3. Set in `apps/web/.env.local`:
   ```
   RESEND_API_KEY=re_...
   FROM_EMAIL=noreply@yourdomain.com
   ```

**Verify:** Sign up a new user and check the Resend dashboard for a delivered welcome email.
Without a key you will instead see `email skipped: RESEND_API_KEY not set` in the logs —
that is the expected no-key behaviour, not a failure.

**What is wired where:**

| Email          | Trigger                                                        |
| -------------- | -------------------------------------------------------------- |
| Welcome        | First sign-in only, from `syncUser`                            |
| Budget alert   | A CSV import pushes a category past 80% or 100% of its budget  |
| Weekly summary | `POST /api/cron/weekly-summary` — needs a scheduler, see below |

Budget alerts fire only when an import _crosses_ a threshold it was not already past, so
re-importing the same file sends nothing.

---

## 6. Weekly summary — pick a scheduler

**Why it matters:** The weekly summary endpoint exists and is tested, but nothing calls it
on a schedule. It is a plain authenticated POST, so any scheduler works.

**Steps:**

1. Choose a secret and set it in `apps/web/.env.local`:
   ```
   CRON_SECRET=<a long random string>
   ```
   Without it the route rejects every request with a 401 — an unconfigured deployment
   cannot be triggered by anyone.
2. Point a scheduler at it weekly. On Vercel, add to `vercel.json`:
   ```json
   {
     "crons": [{ "path": "/api/cron/weekly-summary", "schedule": "0 9 * * 1" }]
   }
   ```
   Vercel sends its own auth header, so you would adjust `isAuthorised` in
   `apps/web/src/app/api/cron/weekly-summary/route.ts` to accept it. Anywhere else, a
   plain curl on a timer works:
   ```bash
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/weekly-summary
   ```

**In production**, `CRON_SECRET` must be set in the hosting environment (Vercel project
settings, fly secrets, container env — wherever the app actually runs), not just in a local
file, and the scheduler must send the same value as `Authorization: Bearer <secret>`. It is
already declared in `turbo.json` `globalEnv`, so Turbo-run tasks receive it.

**Verify:** Call it by hand with the header. It returns `{"sent":N,"skipped":M,"failed":K}`.
Users with no transactions in the last week are skipped rather than sent an empty summary,
and anyone already sent to in the last six days is skipped — so a retry after a partial run
resumes rather than resending.

---

## 7. Optional — free port 3000

**Why it matters:** AdGuard Home (Docker) holds port 3000, so the web app falls back to
3001, which collides with the marketing site's hardcoded `next dev -p 3001`. You cannot run
both apps at once as configured.

**Options:**

- Move AdGuard off 3000 (edit its Docker port mapping), or
- Leave it and run only one app at a time, or
- Change the marketing app's port in `apps/marketing/package.json`.

This is a machine-local decision, so it is left to you rather than changed in the repo.

---

## Not blocking

These are noted for completeness but do not affect daily use:

- **Production deploy pipeline** — `pnpm db:migrate` now works (the existing `0000`
  migration has been baselined and later migrations apply cleanly), but nothing runs it on
  deploy yet. Only matters when you deploy somewhere real.
- **Convex migration** — `CONVEX_MIGRATION_PLAN.md` proposes replacing Postgres/Drizzle/tRPC
  wholesale. Worth deciding before investing further in the Postgres layer.
