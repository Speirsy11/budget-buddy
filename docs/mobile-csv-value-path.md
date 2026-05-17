# Mobile CSV value path

Purpose: define the lowest-risk mobile value wedge before Open Banking or payment work.

## Why CSV first

CSV import is already a core web capability, has lower compliance overhead than persistent bank connections, and gives users a privacy-forward option: import statements when they choose, without storing bank API tokens.

## v0: explicit web handoff card

Fastest safe mobile implementation:

- Add an “Import CSV on web” card to the mobile Transactions screen.
- Explain that mobile currently supports reviewing/searching/classifying transactions after import.
- Link to the web import route when a production web URL exists.
- Include a privacy note: CSV import does not require connecting a bank account.

Acceptance criteria:

- No file parsing on mobile yet.
- No real bank credentials, provider accounts, or Open Banking SDKs.
- Clear copy that import is web-only for now.
- Analytics/transactions screens handle newly imported data cleanly.

## v1: native document-picker import

If v0 validates value, add a true mobile import:

- Use `expo-document-picker` to choose a CSV file.
- Reuse existing server-side validation/import semantics where possible.
- Show a preview: detected columns, row count, date/currency assumptions, duplicate count.
- Require explicit confirmation before mutation.
- Keep parsing logs free of raw transaction descriptions and account data.

Acceptance criteria:

- Import mutation requires authenticated API context.
- Invalid CSVs produce actionable errors.
- Duplicate protection matches the web flow.
- No transaction data is written to console logs, crash reports, or analytics.

## Revenue angle

A Plus tier can be framed around polished import, recurring budgets, better categorisation, exports, and mobile UX before Open Banking economics are known. Open Banking remains a later Pro path.

## Deferred until approval

- TestFlight or App Store builds.
- Stripe/IAP paid flows.
- Open Banking provider setup.
- Handling real financial data in testing.
