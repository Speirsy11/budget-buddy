# Open Banking provider inventory — 2026-05-15

Internal note. No accounts were created, no sales forms were submitted, and no real financial data was touched.

## Decision takeaway

Keep Budget Buddy's near-term paid wedge CSV/mobile-first. Open Banking should stay behind a later Pro decision until UK provider economics, onboarding, mobile Link support, and compliance responsibilities are confirmed.

## Current provider/economics signals

| Provider | Current signal | Budget Buddy implication | Source |
| --- | --- | --- | --- |
| Plaid UK | UK pricing page offers Free testing/live-call limits and Custom for scale; billing docs say UK/EU-serving customers are Custom only, and Transactions uses subscription-style billing once paid. | Strong DX, but likely not safe to price a low-cost Pro tier until Plaid confirms UK production pricing and minimums. | https://plaid.com/en-gb/pricing/ ; https://plaid.com/docs/account/billing/ |
| TrueLayer | Official docs still cover Data API basics and provider capability lookup. Public pricing clarity for small data-only apps is limited. | Viable comparison candidate, but confirm data product access, mobile UX, pricing, and startup acceptance before implementation. | https://docs.truelayer.com/docs/data-api-basics |
| Yapily | Official docs support direct open-banking registration if the company is regulated, or using Yapily's console/permissions model. | More enterprise/compliance-shaped; likely useful later, not a fast solo-builder wedge. | https://docs.yapily.com/getting-started/integration-setup/registration |
| GoCardless / Nordigen | Official Bank Account Data docs still exist and enriched data points to sales for product/pricing questions. Community reports suggest standalone new-customer access may be constrained. | Do not assume the old free Nordigen path is available for a new Budget Buddy product; verify only after approval. | https://developer.gocardless.com/bank-account-data/enriched-bank-data-overview/ ; https://gocardless.com/bank-account-data/coverage/ |
| Stripe Billing / payments | Stripe Billing docs support subscription integration; UK pricing page is pay-as-you-go/custom. iOS app policy still needs review for in-app digital features. | Build web billing/account management first if needed; keep mobile paid flows informational until policy route is chosen. | https://docs.stripe.com/billing?locale=en-GB ; https://stripe.com/gb/pricing |

## What to ask before any provider implementation

1. Is production access self-serve for a UK consumer budgeting app, or sales/custom only?
2. What are minimum monthly/annual commits, per-item fees, transaction refresh fees, and historical data costs?
3. Does the provider support mobile Link/OAuth return flows cleanly for Expo/React Native?
4. What regulated-status, FCA/PSD2, agent, or TPP requirements apply to Budget Buddy's model?
5. What data retention, token encryption, deletion, audit logging, and support obligations must be added?
6. Can a user disconnect/revoke consent from inside the app, and how are 90-day reconsent flows handled?
7. What happens to margins at £3.99, £4.99, £7.99, and £79.99/year subscription points?

## Recommended sequencing

1. Finish mobile auth/API production safety and keep all real finance data out of local testing.
2. Add a mobile CSV/privacy import path or explicit web handoff so the app has value without persistent bank sync.
3. Add web billing/account management only after the product wedge is clear.
4. Then request approval to contact/compare providers or create sandbox accounts.
5. Only after provider economics are known, design the Open Banking Pro UX.

## Guardrail

Do not create provider accounts, contact sales, enter bank credentials, process real customer data, deploy production, or launch paid flows without Charlie's explicit approval.
