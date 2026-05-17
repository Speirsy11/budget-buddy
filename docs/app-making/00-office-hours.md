# Budget Buddy office hours

## One-sentence product

Budget Buddy helps UK users turn bank CSV exports into a simple daily budget view without connecting a bank account first.

## User and painful moment

A user wants to know “can I spend this?” but their bank app shows transactions, not a useful 50/30/20 plan or trend summary. They may not trust a small new app with persistent Open Banking access yet.

## Narrow wedge

CSV-first privacy budgeting: upload statements on web, review/search/classify on mobile, and get a quick 50/30/20 budget readout.

## Build/reshape/park verdict

**Reshape toward a CSV/mobile trust wedge before paid Open Banking.** The app already has useful foundations, but production readiness depends on removing local simulator hacks, making mobile auth/API configuration safe, and closing the obvious mobile import/value gap.

## Assumptions

- UK consumer budget app for now.
- Real bank data remains out of local testing.
- Open Banking, subscriptions, TestFlight, App Store, deployments, and public launch stay approval-gated.
