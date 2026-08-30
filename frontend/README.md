# Clapback Frontend

The Client layer implementation lives entirely under `frontend/` and is executed sequentially against the shared contract and Trusted Platform gates.

## Structure

```text
frontend/
  apps/mobile/          Expo SDK 57 Android-first Creator app
  apps/web/             Reserved for the Reviewer and Demo Admin React app
  packages/contracts/   Canonical public models, enums, and Zod schemas
  packages/demo-data/   Stable local fixtures for Trusted Platform-independent development
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

OAuth uses the native scheme `clapback://oauth/callback`, so the real Meta flow must eventually be tested in an Android development build rather than Expo Go. The active demo gate intentionally uses Backend demo sign-in and connects the current Expo screens directly to the local Express multipart/AI/review flow; Meta OAuth, signed TUS, and production infrastructure do not block that gate.

For QR testing from another phone, configure the mobile API URL and Backend public base URL to the Mac's LAN address or an HTTPS tunnel rather than `localhost` or the Android emulator-only `10.0.2.2` address.

## Trust-boundary rule

The Client layer displays Trusted Platform-calculated ClapScore, eligibility, Submission status, Scoreboard ranking, and Payout amounts. It does not calculate or infer them.
