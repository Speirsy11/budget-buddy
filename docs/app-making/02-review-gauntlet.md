# Budget Buddy review gauntlet

## CEO review

Keep the scope tight: CSV-first mobile value is a stronger near-term wedge than building an Open Banking subscription product before provider economics and trust posture are known.

## Design review

Marketing needed more ownable visuals than generic gradient cards. Mobile needed explicit empty/action states around import rather than a dead “coming soon” alert.

## Engineering review

Auth mock mode should be named and guarded as mock mode, not a bypass. Release builds must fail fast when mock auth or localhost API URLs are configured.

## DX/release review

Use EAS profiles and a small guard script. Keep `.env` local-only. Avoid committing generated `ios/` or Pods workaround files.

## Security/privacy review

Do not touch real financial data. Treat Open Banking and paid flows as approval-gated. Use privacy-forward CSV copy, but avoid overclaiming until policies and data deletion/export are reviewed.
