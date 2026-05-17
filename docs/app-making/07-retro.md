# Budget Buddy retro

Date: 2026-05-17

## What changed

- The work shifted from “make the simulator work” to “make the release path hard to misconfigure.”
- The market signal check reshaped the product story: validate CSV-first mobile budgeting before leaning on paid Open Banking.
- Homepage/design work now matches that wedge instead of overpromising full automated finance management.

## What went well

- Mock auth is now explicit, named, dev-gated, and blocked in release profiles.
- The mobile import gap has a pragmatic v1 handoff rather than a dead-end alert.
- The marketing build passes with the new SVG assets and homepage.
- The reusable market-signal skill is packaged for future product audits.

## What still needs care

- Native iOS/RN/Xcode compatibility should be solved at dependency/config level, not by hand-editing generated Pods.
- Mobile bearer auth has source support, but still needs a real Clerk dev-token smoke test.
- The paid/Open Banking story remains a product and compliance decision, not just an engineering task.

## Recommendation

Treat the next slice as a **private preview readiness sprint**: real dev backend URL, Clerk token smoke test, simulator screenshots, and a decision on whether web CSV handoff is enough for v1.
