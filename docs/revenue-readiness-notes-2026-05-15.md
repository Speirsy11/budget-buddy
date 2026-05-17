# Budget Buddy revenue-readiness notes — 2026-05-15

Internal research note for deciding whether Budget Buddy should move toward a paid mobile/open-banking product. Do not use this as public marketing copy without review.

## Current signal snapshot

Budgeting apps have a real subscription market, but the bar is high because users are trusting the app with financial data.

Useful signals checked:

- Plum UK subscription plans show consumers are already used to finance-app tiers around free, low-paid, mid-paid, and premium paid plans: https://help.withplum.com/en/articles/8711801-what-is-a-plum-subscription
- Plaid’s UK pricing page points developers toward custom/account-based pricing rather than a simple self-serve public price list: https://plaid.com/en-gb/pricing/
- Plaid docs note that UK/EU-serving customers are on Custom plans, while newer free-trial language is US/Canada-specific: https://plaid.com/docs/account/billing/
- Plaid UK Transactions product positioning confirms Open Banking / PSD2-compliant transaction access for UK/EU use cases: https://plaid.com/en-gb/products/transactions/
- Recent UK personal-finance/community chatter repeatedly shows two conflicting truths: users like bank-sync convenience, but aggregator pricing/compliance and trust are hard for small builders.

## Pricing hypothesis

Keep the original rough Pro price, but avoid assuming Plaid economics work until provider costs are confirmed.

Possible UK-facing tiers:

| Tier | Price hypothesis | Good for | Notes |
| --- | --- | --- | --- |
| Free | £0 | CSV import, manual budgeting, limited AI classification | Safe wedge; no bank-data dependency. |
| Plus | £3.99-£4.99/mo | Better CSV/import UX, recurring budgets, export, mobile polish | Competes with lower UK app tiers; lower margin risk. |
| Pro | £7.99/mo or £79.99/yr | Open Banking, more AI, multi-account sync | Only viable if provider costs and compliance overhead fit. |
| Early lifetime | one-time, limited slots | Validate willingness to pay without recurring bank-sync liability | Only if scope excludes expensive Open Banking usage. |

Recommendation: validate **CSV/mobile budgeting value first**, then add Open Banking only after provider/compliance cost is known. A paid tier that depends on custom aggregator pricing is riskier than one that sells polished import, mobile UX, and better categorisation.

## Revenue blockers

### P0 — mobile auth and production API safety

Already captured in `docs/mobile-production-readiness-audit.md`. This must be solved before any preview/TestFlight revenue validation.

### P0 — Open Banking provider economics

Plaid UK/EU appears to require custom plans rather than transparent low-volume self-serve pricing. That means a small subscription price can become margin-negative or blocked by onboarding/compliance.

Safe next action:

- Keep provider comparison in [`open-banking-provider-inventory-2026-05-15.md`](open-banking-provider-inventory-2026-05-15.md) current before implementation.
- For each provider, record: UK coverage, sandbox access, startup tier, compliance requirements, API shape, mobile Link support, and pricing visibility.
- Do not create accounts or contact sales without Charlie approval.

### P0 — trust/legal posture

If the app handles bank data, even read-only, public launch needs:

- privacy policy and data-retention statement;
- clear “read-only bank connection” explanation;
- secure token storage/encryption review;
- deletion/export path;
- support/contact route;
- no financial advice or savings guarantees.

### P1 — App Store payment policy

If mobile sells digital app features inside iOS, Apple IAP may be required. Stripe checkout can be used on web in many SaaS contexts, but mobile copy and flows must be reviewed before shipping.

Safe next action:

- Keep mobile Pro screens as informational/locked until a policy-compliant upgrade route is chosen.
- Build web billing/account management first, then decide mobile upgrade UX.

## Best monetisation wedge

Do **not** lead with “AI bank-sync superapp”. The market is crowded and trust-heavy.

Lead with one of these narrower wedges:

1. **Mobile-first 50/30/20 budget check** — quick daily answer: “can I spend this?”
2. **CSV-first privacy budgeting** — useful for people who do not want persistent Open Banking.
3. **UK bank CSV cleanup/import assistant** — lower compliance risk and easier to validate.
4. **Budget Buddy Pro later** — Open Banking once provider economics are confirmed.

## Recommended next local build step

After mobile auth/API guards are finished:

1. Follow [`mobile-csv-value-path.md`](mobile-csv-value-path.md): start with a mobile Transactions “Import CSV on web / CSV privacy mode” card, then a real `expo-document-picker` CSV import only if small enough.
2. Add a Pro locked-state component that avoids promising Open Banking until provider cost is confirmed.
3. Add billing/account web route before any mobile paid flow.

## Approval-gated external actions

Do not do these without Charlie approval:

- TestFlight/App Store builds;
- Stripe/Plaid/TrueLayer/Yapily/Moneyhub/Finexer account setup or sales contact;
- production deploys;
- public pricing page;
- handling real financial data;
- outreach or customer interviews.
