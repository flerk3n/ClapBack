# Clapback Frontend

Developer A-owned implementation lives entirely under `frontend/`.

## Structure

```text
frontend/
  apps/mobile/          Expo SDK 57 Android-first Creator app
  apps/web/             Reserved for the reviewer and Demo Admin React app
  packages/contracts/   Canonical public models, enums, and Zod schemas
  packages/demo-data/   Stable local fixtures for backend-independent development
  packages/ui/          Shared visual tokens and pure formatters
  DESIGN_SYSTEM.md      Product-wide visual and interaction rules
```

## Mobile commands

Run commands from `frontend/apps/mobile`:

```sh
npm install
npm run typecheck
npm run lint
npm run android
```

OAuth uses the native scheme `clapback://oauth/callback`, so the real Meta flow must be tested in an Android development build rather than Expo Go. The current frontend slice uses contract-validated demo data until the Backend endpoints are connected.

## Ownership rule

Frontend displays backend-owned ClapScore, eligibility, Submission status, Scoreboard ranking, and Payout amounts. It does not calculate or infer them.
