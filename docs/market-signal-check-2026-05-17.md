# Budget Buddy market signal check — 2026-05-17

## Candidate

Budget Buddy helps UK personal-budgeting users turn bank CSV exports into a quick mobile/web 50/30/20 spending check with AI-assisted categorisation, without requiring a persistent bank connection at first.

## Verdict

**Validate**, leaning **reshape** away from the current broad “AI finance companion + Open Banking Pro” pitch.

The repo has a credible working product surface: web dashboard/import/settings, Expo mobile dashboard/transactions/budget/analytics/settings, shared tRPC backend, CSV import, AI classification, Stripe/Plaid package work, and production-readiness notes. But the sellable proof is still weak: no user demand evidence, no analytics/conversion data, no live billing route, no mobile import, no production mobile auth verification, and no confirmed UK Open Banking provider economics.

Near-term productisation should therefore validate the lowest-risk wedge: **privacy-forward CSV budgeting on mobile**, not bank-sync automation or broad AI money coaching.

## Best wedge

**“CSV-first mobile 50/30/20 budget check for UK bank users who want privacy and do not want to connect their bank.”**

Promise: “Import a bank CSV, get a clean spending split, quick ‘can I spend this?’ feedback, and better categories.”

Includes:

- UK bank CSV import and cleanup.
- 50/30/20 budget view.
- Searchable transactions.
- AI-assisted classification/correction.
- Export/delete/privacy-first messaging.

Excludes for now:

- Open Banking auto-sync.
- Savings/investment advice.
- “Thousands of users” or unverified accuracy claims.
- In-app paid upgrades until iOS/Stripe/IAP policy is settled.
- Real customer financial data handling until privacy/security docs are launch-ready.

## Scorecard

| Dimension                      | Score | Rationale                                                                                                                                                                    |
| ------------------------------ | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pain intensity                 |   3/5 | Budgeting and CSV cleanup are real pains, but repo evidence does not show urgent repeated user demand yet.                                                                   |
| Reachable niche                |   3/5 | UK bank CSV users are findable via budgeting communities, bank-specific search, and privacy-conscious personal-finance users. Need proof of acquisition.                     |
| Willingness to pay             |   2/5 | Subscription market exists, but Budget Buddy has no observed payments, waitlist, interviews, or conversion signal. CSV-only value may support low Plus pricing, not Pro yet. |
| Differentiation                |   2/5 | 50/30/20 + AI categorisation + CSV import is useful but crowded/generic. Privacy-first UK CSV cleanup is sharper.                                                            |
| Trust/compliance manageability |   2/5 | CSV-first is manageable; Open Banking, AI claims, financial-data retention, App Store policy, and security copy raise the burden.                                            |
| Build/maintenance leverage     |   4/5 | Good leverage from existing TypeScript/Turborepo, web app, mobile app, tRPC, Drizzle/Postgres, CSV importer, AI classification, and docs.                                    |

Overall: **16/30** — enough to validate cheaply, not enough to launch paid Pro/Open Banking.

## Evidence found

- `README.md` describes a mature app shape: Next.js web, Expo mobile, tRPC, Drizzle/Postgres, Clerk, Plaid, Stripe, and AI classification.
- `apps/marketing/src/app/page.tsx` has a polished landing page, Free/Pro pricing cards, AI/CSV/security positioning, and CTAs.
- `packages/features/payments/src/plans.ts` defines Free, Pro at **£7.99/mo**, and Pro Yearly at **£79.99/yr**, with Open Banking and connected-account limits in Pro.
- `apps/web/src/app/(dashboard)/dashboard/import/page.tsx` has working web CSV import flow, bank export guides, and AI auto-classification mutation.
- Web app has dashboard, transactions, budget, analytics, settings, export JSON, and disabled account deletion/contact-support affordance.
- Mobile app has dashboard, budget, analytics, transactions, settings, empty/loading states, and a web-only import prompt.
- Screenshots show credible web/mobile UI, but mobile appears empty/unpopulated and early-stage.
- `docs/mobile-production-readiness-audit.md` honestly documents blockers: mobile bearer-token auth uncertainty, production API URL setup, mobile CSV gap, payment UX gap, Open Banking UI gap, weak mobile tRPC typing.
- `docs/revenue-readiness-notes-2026-05-15.md` already identifies the strongest monetisation sequence: CSV/mobile value first, Open Banking later.
- `docs/open-banking-provider-inventory-2026-05-15.md` captures provider-economics uncertainty and approval-gated external actions.

## Evidence missing

- No user interviews, waitlist, usage analytics, sign-up conversion, retention, or willingness-to-pay evidence found.
- No competitor review mining or quantified search demand in this repo check.
- No production deploy/TestFlight/App Store evidence.
- No live billing/account-management route found despite Stripe package support.
- No mobile-native CSV import yet; mobile redirects users to web.
- No confirmed UK Open Banking production pricing/minimums.
- No public privacy policy/terms implementation found behind marketing footer links.
- No verified support workflow, account deletion flow, or data-retention policy.
- No substantiation found for public claims like “95%+ accuracy,” “bank-level encryption,” or “Join thousands of users.”

## Key risks

1. **Trust gap:** personal-finance users need confidence before uploading bank statements. Security/privacy copy must be true and specific.
2. **Overclaiming:** current marketing claims imply proven AI accuracy, encryption posture, free trial, cancellation, and existing user traction that the repo evidence does not prove.
3. **Open Banking economics:** Plaid/UK provider costs and onboarding may break a £7.99/mo Pro model.
4. **Mobile readiness:** mobile UX exists, but import, production API/auth, billing, and typed API safety remain incomplete.
5. **Crowded category:** generic “AI finance companion” competes with stronger incumbents; a narrow CSV/privacy wedge is easier to explain.
6. **App Store/payment policy:** mobile subscription flows need policy review before paid launch.
7. **Support burden:** financial-data bugs, deletion requests, import edge cases, and category disputes can become high-touch quickly.

## Pricing hypothesis

Do not lead with the existing **£7.99/mo Open Banking Pro** until provider costs are confirmed.

Better validation pricing:

- **Free:** limited CSV import, 50/30/20 dashboard, basic categories, capped history/transactions.
- **Plus:** **£3.99–£4.99/mo** or **£29–£39/yr** for polished CSV import, recurring budgets, better categorisation, export, mobile UX, and privacy mode.
- **Pro later:** **£7.99/mo or £79.99/yr** only if Open Banking costs, compliance, support, and mobile/web billing flows are proven.
- Optional early validation: limited **one-time lifetime/deal** for CSV-only features, explicitly excluding future Open Banking costs.

## 7-day validation plan

Day 1 — tighten the offer:

- Rewrite one landing-page variant around “UK bank CSV to mobile 50/30/20 budget in minutes.”
- Remove or soften unproven claims: “95%+,” “thousands,” “bank-level,” “free trial/cancel anytime” unless backed by working systems.

Day 2 — ship a tiny proof path locally/staging-ready:

- Add mobile Transactions “Import CSV on web” card with privacy-first copy and a real configured web URL placeholder.
- Add an explicit empty-state CTA from mobile dashboard to the import path.

Day 3 — add trust basics:

- Draft privacy/data-retention/account-deletion pages.
- Document exactly what CSV data is stored, how deletion/export works, and what AI sees.

Day 4 — make a demo dataset and proof screenshots:

- Seed representative anonymised transactions.
- Capture populated web/mobile dashboard, budget, transactions, and analytics screenshots.

Day 5 — run no-account validation:

- Share the landing-page copy/screenshots with 5–10 trusted UK budgeting/personal-finance contacts or communities only with Charlie approval for outreach.
- Ask: “Would you upload a CSV?”, “What would make you trust it?”, “Would you pay £4/mo?”, “What app do you use now?”

Day 6 — price test without payments:

- Add non-charging CTA choices: Free, Plus £4/mo, Pro/Open Banking waitlist.
- Track clicks locally or via approved analytics before enabling payment.

Day 7 — decide:

- Summarise objections, trust blockers, desired imports/banks, and price reaction.
- Choose continue/kill based on criteria below.

## Kill / continue criteria

Continue if, within 7 days:

- At least 5 target users understand the CSV/privacy wedge without explanation.
- At least 3 say they would upload an anonymised or real CSV if privacy/deletion is clear.
- At least 2 express credible willingness to pay around **£3.99–£4.99/mo** for CSV/mobile/category value.
- The mobile/web demo can show a populated budget flow end-to-end without Open Banking.
- Trust/privacy objections are specific and fixable, not categorical refusal.

Kill or park if:

- Users only want automatic bank sync and reject CSV import.
- Users will not trust a small independent app with bank CSVs even after privacy explanation.
- No one shows willingness to pay for CSV/mobile value.
- Open Banking becomes necessary to create value but provider economics remain unknown.
- The product cannot truthfully support its marketing/security claims in a lightweight launch.

## Recommended next decision

Proceed with **CSV/mobile validation** and postpone paid Pro/Open Banking. The codebase is strong enough to demonstrate value, but the market signal is not strong enough for a paid finance launch yet.
