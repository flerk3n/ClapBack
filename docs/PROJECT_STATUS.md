# Clapback Project Status

> Canonical project snapshot for implemented capabilities, validation, integration blockers, and next actions.
>
> Last updated: 2026-08-30

## Executive summary

The polished Expo Creator app and the demo Express Backend now coexist in this repository. Each workstream runs independently, but they are **not ready to connect yet** because several Backend payloads, fixture identifiers, routes, authorization checks, and upload behavior do not satisfy the shared integration contract.

| Area | Status | Summary |
| --- | --- | --- |
| Creator mobile UI | Ready for device testing | Complete mocked Creator journey with real media selection and preview |
| Shared frontend contracts | Implemented | Canonical enums and Zod schemas exist under `frontend/packages/contracts` |
| Backend runtime | Demo-ready | Express API builds and passes core health/auth/Bounty smoke checks |
| Frontend–Backend integration | Blocked | Wire-contract, routing, authorization, fixture, and upload mismatches remain |
| Durable infrastructure | Not implemented | Backend state and uploads are local/in-memory rather than Supabase/TUS |
| Reviewer/admin web | Not implemented | `frontend/apps/web` remains reserved |

## Repository state

- Frontend implementation commit: `bbf62b1` — `feat(mobile): build polished creator bounty flow`
- Pulled Backend commit: `2217107` — `feat(backend): implement platform plan, contract API, review rounds, and scoring`
- Local merge commit: `858f141`
- Local `main` is currently ahead of `origin/main`; no push was performed during Backend retrieval.
- Unrelated unstaged mobile ESLint/package changes were present when this document was introduced and were intentionally left untouched.

## Implemented capabilities

### Creator mobile app

Location: `frontend/apps/mobile`

- Expo SDK 57 app with Android-first configuration and Expo Router.
- Restrained premium design language documented in `frontend/DESIGN_SYSTEM.md`.
- Demo Instagram sign-in and SecureStore-backed session token.
- Creator Profile confirmation and niche selection.
- Swipeable Discover Bounty stack with Accept and Skip actions.
- Acceptance details, payout display, and Active tasks.
- Real device video selection and preview.
- Simulated upload progress and Submission state progression.
- AI-passed result with per-Deliverable evidence and confidence.
- Shared terminology and data schemas from `frontend/packages/contracts`.
- Deterministic mobile fixtures from `frontend/packages/demo-data`.

Current mobile boundaries:

- Authentication, API calls, Acceptance creation, upload transport, and AI processing are mocked.
- Only the demo access token persists; workflow state resets with the app process.
- AI failure and processing-error states exist in UI logic but are not reachable through the normal mock journey.
- Reviewer, admin, scoreboard, and payout interfaces are not implemented.

### Backend API

Location: `backend`

- Express 5 API with request IDs and response-envelope helpers.
- Demo Creator/admin JWT issuance.
- Bounty, Acceptance, Submission, review, scoreboard, payout, and ledger logic.
- Local multipart MP4 upload with a 100 MB limit.
- FFmpeg audio extraction.
- ElevenLabs transcription and Gemini/OpenAI/keyword verification fallbacks.
- Simulated reviewer scoring and ClapCoin ledger behavior.
- In-memory users, workflow entities, scores, payouts, and fixtures.
- Canonical `/v1` routes plus compatibility aliases.

Current Backend boundaries:

- Restarting the API clears all transactional state.
- Uploaded files are local and publicly served from `/uploads`.
- Provider keys are optional because demo fallbacks exist.
- The advertised TUS descriptor does not have a corresponding TUS byte-upload implementation.

## Validation record

### Mobile

Validated on 2026-08-30:

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- Strict no-cache ESLint with zero warnings — passed.
- `npx expo install --check` — dependencies compatible.
- `npx expo config --type public` — valid SDK 57 configuration.
- Android production export — passed with 1,913 bundled modules.

Still required:

- Interactive Android device/emulator review for gestures, permissions, video playback, haptics, navigation, and visual polish.

### Backend

Validated on 2026-08-30:

- `npm ci` — passed; npm reported zero vulnerabilities.
- `npm run build -- --noEmit` — passed.
- Node `v22.18.0` — compatible with the locked dependencies.
- FFmpeg `8.1.1` with `libmp3lame` — available.
- `/health/ready` — passed in isolated runtime smoke test.
- Demo Creator authentication — passed.
- Authenticated Bounty retrieval — passed with nine Bounties.

Missing validation infrastructure:

- No automated Backend test suite.
- No Backend lint configuration/script.
- No shared-contract response parsing tests.
- No complete real-video processing test was run.

## Integration blockers

### P0 — must resolve before connecting the mobile app

| Blocker | Impact | Relevant areas |
| --- | --- | --- |
| Backend fixture Bounty IDs are strings such as `bounty-novaskin-ugc`, while shared schemas require UUIDs | Bounty, Acceptance, and Submission responses fail Zod parsing | `backend/src/db/memoryDb.ts`, `frontend/packages/contracts/src/index.ts` |
| Backend Creator/Bounty/Acceptance response shapes differ from shared schemas | The mobile API layer cannot safely consume responses | Backend route mappers and shared contracts |
| Upload descriptor says `TUS`, but the endpoint only marks an upload complete and accepts no video bytes | Contracted mobile upload flow cannot work | `backend/src/routes/submissions.ts` |
| Admin routes do not apply `adminMiddleware` | Unauthenticated callers can perform admin, payout, round, and reset operations | `backend/src/routes/admin.ts`, `backend/src/index.ts` |

### P1 — required for a safe end-to-end Creator flow

| Blocker | Impact | Relevant areas |
| --- | --- | --- |
| `GET /v1/acceptances` is mounted to the Bounty router root | Canonical endpoint returns Bounties instead of Acceptances | `backend/src/index.ts`, `backend/src/routes/bounties.ts` |
| Backend and frontend use different fixture Creators and Bounties | IDs, visuals, and expected demo behavior drift between clients | Both demo-data implementations |
| Creator middleware verifies JWTs but does not enforce the `CREATOR` role | Admin tokens can reach Creator routes | `backend/src/middleware/auth.ts` |
| Submission retrieval and creation do not consistently enforce resource ownership | Creators may access or reference another Creator’s workflow entities | `backend/src/routes/submissions.ts` |
| Demo login payload/response differs from the integration contract and omits refresh behavior | Real auth client cannot follow the documented exchange | `backend/src/routes/auth.ts` |
| Relative upload endpoint conflicts with the shared absolute-URL schema | Upload descriptor parsing fails even before transport begins | Backend upload mapper and `uploadDescriptorSchema` |

### P2 — required beyond a local demo

- Replace in-memory state with Supabase/Postgres and transactional persistence.
- Replace local public upload storage with verified private object storage.
- Implement Meta OAuth start/callback/exchange/refresh.
- Enforce `Idempotency-Key` behavior on contracted mutations.
- Normalize Multer errors into canonical video validation errors.
- Prevent internal provider/error details from leaking through 500 responses.
- Reconcile reviewer simulation with canonical `AI_PASSED -> IN_REVIEW -> SCORED` transitions.
- Define a consistent unit and balance update policy for payout/ledger entries.

## Next actions

1. Make Backend route payloads parse successfully with `frontend/packages/contracts` Zod schemas.
2. Unify stable fixture IDs and data across Backend and frontend demo packages.
3. Correct `/v1/acceptances` and protect all admin routes.
4. Choose and implement one real upload path:
   - genuine TUS/object-storage upload matching the contract, or
   - explicitly revise the shared contract to use multipart upload.
5. Add automated contract smoke tests for auth, profile, Bounties, Acceptances, Submissions, and upload descriptors.
6. Build the mobile API client and session/token handling.
7. Replace `MockAppProvider` incrementally while retaining a selectable demo mode.
8. Run a physical Android end-to-end integration pass.

## Change log

### 2026-08-30 — Project status tracking

- Added this canonical project status document.
- Added persistent Kiro workspace guidance requiring status updates after meaningful project changes.

### 2026-08-30 — Backend retrieval and verification

- Pulled Backend commit `2217107` from GitHub and merged it with the Creator frontend.
- Installed locked Backend dependencies and verified TypeScript compilation.
- Passed health, demo authentication, and authenticated Bounty retrieval smoke checks.
- Documented contract, upload, authorization, routing, fixture, and persistence blockers.

### 2026-08-30 — Creator frontend implementation

- Added the dedicated `frontend` workspace and comprehensive design system.
- Implemented the mocked Expo Creator journey from onboarding through Submission results.
- Added canonical frontend contracts, demo data, and shared UI tokens.
- Passed TypeScript, lint, Expo configuration, dependency, and Android export validation.

## Maintenance rules

- Update this file after meaningful code, configuration, architecture, integration, or documentation changes.
- Record only completed or directly observed work; do not report planned work as implemented.
- Include validation commands and outcomes when behavior changes.
- Add new blockers with priority and remove or mark blockers resolved when verified.
- Keep the executive summary and next actions synchronized with the detailed sections.
- Add one concise dated change-log entry per coherent task, newest first.
- Do not update this file for read-only discussion, trivial formatting, or unrelated local edits.
