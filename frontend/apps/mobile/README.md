# Clapback Creator Mobile

Expo SDK 57 mobile app for the Clapback creator experience. The current slice uses canonical shared contracts and deterministic demo data to exercise the Creator flow before Backend integration.

## Run locally

```bash
npm install
npm run android
```

`npm run android` starts Expo and opens the Android target. The media picker, video preview, gestures, haptics, and SecureStore behavior should be verified on an emulator or device.

## Validation

```bash
npm run typecheck
npm run lint
npx expo install --check
npx expo config --type public
npx expo export --platform android --output-dir /tmp/clapback-mobile-export
```

All commands are one-shot except the platform start scripts.

## Project structure

- `src/app` — Expo Router screens for onboarding, Discover, Acceptance, upload, and Submission status
- `src/components` — mobile UI primitives and composed experience components
- `src/state` — mocked session and Creator workflow state
- `../../packages/contracts` — canonical Zod schemas, enums, and shared terminology
- `../../packages/demo-data` — deterministic Creator and Bounty fixtures
- `../../packages/ui` — shared design tokens and formatters
- `../../DESIGN_SYSTEM.md` — visual, interaction, content, motion, and accessibility rules

## Current integration boundary

Authentication, Bounty data, Acceptance creation, upload progress, and AI status transitions are mocked. The video picker and preview use real device APIs. Backend integration should preserve the shared contract names and replace the mock provider without changing product terminology.
