# Clapback Project Status

> Canonical project snapshot for implemented capabilities, validation, integration blockers, and next actions.
>
> Last updated: 2026-08-30

## Executive summary

The polished Expo Creator app and the local Express Backend coexist in this repository. The mocked Creator journey now runs successfully on the `Pixel_9` Android emulator. The Backend compiles and its health/auth/Bounty smoke path works, but it remains a local prototype rather than a contract-compliant integration target.

The transcription architecture is now explicit: upload the original MP4 to private Storage, provide ElevenLabs a short-lived signed `source_url`, request asynchronous webhook processing, and correlate the webhook to the Submission. FFmpeg and derivative MP3 files are not part of the base architecture. The current Backend FFmpeg path is implementation drift that must be removed before integration.

| Area | Status | Summary |
| --- | --- | --- |
| Creator mobile UI | Mock demo working | Creator journey runs in Expo Go on the Pixel 9 emulator |
| Shared frontend contracts | Partially implemented | Core enums and Zod schemas exist, but Backend does not consume them and full endpoint schemas are incomplete |
| Backend runtime | Local prototype working | Express API builds and passes health/auth/Bounty smoke checks |
| Frontend–Backend integration | Blocked | Wire contracts, fixtures, routes, auth, ownership, upload, and transcription must be aligned |
| Durable infrastructure | Not implemented | Backend state and uploads are local/in-memory rather than Supabase/private TUS |
| Reviewer/admin web | Not implemented | `frontend/apps/web` remains reserved |

## Repository state

- Frontend implementation commit: `bbf62b1` — `feat(mobile): build polished creator bounty flow`.
- Pulled Backend commit: `2217107` — `feat(backend): implement platform plan, contract API, review rounds, and scoring`.
- Frontend/Backend merge commit: `858f141`.
- Project-status tracking commit: `0715509`.
- `main` matched `origin/main` before the current documentation edits.
- Unrelated unstaged mobile ESLint/package changes were already present and remain intentionally untouched.

## Implemented capabilities

### Creator mobile app

Location: `frontend/apps/mobile`

- Expo SDK 57 app with Android-first configuration and Expo Router.
- Restrained premium design language documented in `frontend/DESIGN_SYSTEM.md`.
- Demo Instagram sign-in and SecureStore-backed demo session token.
- Creator Profile confirmation and Niche selection.
- Swipeable Discover Bounty stack with Accept and Skip actions.
- Acceptance details, payout display, and Active tasks.
- Real device/emulator video selection and preview.
- Simulated upload progress and Submission state progression.
- AI-passed result with per-Deliverable evidence and confidence.
- Shared terminology and core schemas from `frontend/packages/contracts`.
- Deterministic mobile fixtures from `frontend/packages/demo-data`.

Current mobile boundaries:

- Authentication, API calls, Acceptance creation, upload transport, and AI processing are mocked.
- Only the demo access token persists; workflow state resets with the app process.
- AI failure and processing-error states exist in UI logic but are not reachable through the normal mock journey.
- The upload screen does not yet perform a real Backend/TUS upload.
- Reviewer, admin, Scoreboard, and Payout interfaces are not implemented.

### Backend API

Location: `backend`

- Express 5 API with request IDs and response-envelope helpers.
- Demo Creator/admin JWT issuance.
- Bounty, Acceptance, Submission, review, Scoreboard, Payout, and ledger logic.
- Local multipart MP4 upload with a 100 MB limit.
- ElevenLabs transcription and Gemini/OpenAI/keyword verification fallbacks.
- Simulated reviewer scoring and ClapCoin ledger behavior.
- In-memory users, workflow entities, scores, Payouts, and fixtures.
- Canonical-looking `/v1` routes plus compatibility aliases.

Current Backend boundaries:

- Restarting the API clears all transactional state.
- Uploaded files are local and publicly served from `/uploads`.
- Provider keys are optional because demo fallbacks exist; the STT fallback returns fixed NovaSkin text unrelated to the selected video.
- The advertised TUS descriptor has no corresponding byte-upload implementation.
- The current pipeline unnecessarily converts MP4 to MP3 through deprecated `fluent-ffmpeg` before ElevenLabs.
- Real end-to-end video upload/transcription was not validated.

## Direct-video transcription decision

The base flow is binding:

1. Mobile or admin web uploads the original accepted MP4 unchanged to private Storage.
2. Backend verifies the object and creates a short-lived signed read URL.
3. Backend sends that URL to ElevenLabs as `source_url`, enables asynchronous webhook delivery, and includes the Submission/correlation ID in `webhook_metadata`.
4. A verified, idempotent webhook stores the normalized transcript and queues Deliverable evaluation.
5. No client or server extracts audio, transcodes video, or creates a temporary MP3 in the normal path.

ElevenLabs documents direct audio/video file input, `source_url`, asynchronous webhooks, and webhook metadata in the [Speech-to-Text convert API](https://elevenlabs.io/docs/api-reference/speech-to-text/convert). FFmpeg may be proposed only as a compatibility fallback after representative Android MP4 files demonstrate a codec/container issue that direct transcription cannot handle.

Content from the linked documentation has been rephrased for compliance with licensing restrictions.

Current code changes still required:

- Replace `transcribeAudio(audioPath)` with a direct-video provider adapter.
- Remove `backend/src/services/audioExtractor.ts`.
- Remove `fluent-ffmpeg` and `@types/fluent-ffmpeg` from Backend manifests/lockfile.
- Remove MP3 temporary-file creation and cleanup from `backend/src/routes/submissions.ts`.
- Stop logging transcript content and raw provider error bodies.
- Implement the signed `source_url` plus webhook path after private Storage exists.

## Validation record

### Mobile

Validated on 2026-08-30:

- `npm run typecheck` — passed before the current unrelated mobile package/config edits.
- `npm run lint` — passed before the current unrelated mobile package/config edits.
- Strict no-cache ESLint with zero warnings — passed.
- `npx expo install --check` — dependencies compatible at that validation point.
- `npx expo config --type public` — valid SDK 57 configuration.
- Android production export — passed with 1,913 bundled modules.
- Pixel 9 AVD boot and ADB discovery — passed after resetting to Android SDK ADB.
- Expo Go installation and development bundle — passed with 2,076 modules.
- User reports the mocked demo journey is working in the emulator.

Still required:

- Re-run typecheck/lint/dependency checks after resolving the currently unstaged mobile package/config changes.
- Complete a physical Android device review for permissions, video playback, haptics, deep links, offline/error recovery, accessibility, and visual polish.
- Use an Android development build rather than Expo Go for real Meta OAuth/deep-link validation.

### Backend

Validated on 2026-08-30:

- `npm ci` — passed; npm reported zero vulnerabilities.
- `npm run build -- --noEmit` — passed.
- Node `v22.18.0` — compatible with the locked dependencies.
- `/health/ready` — passed in isolated runtime smoke test.
- Demo Creator authentication — passed.
- Authenticated Bounty retrieval — passed with nine Bounties.

Missing validation infrastructure:

- No automated Backend test suite.
- No Backend lint configuration/script.
- No shared-contract response parsing tests.
- No complete real-video processing test.
- No direct-video ElevenLabs webhook integration test.

## Integration blockers

### P0 — must resolve before connecting the mobile app

| Blocker | Impact | Relevant areas |
| --- | --- | --- |
| Backend fixture Bounty IDs are strings such as `bounty-novaskin-ugc`, while shared schemas require UUIDs | Bounty, Acceptance, and Submission responses fail Zod parsing | `backend/src/db/memoryDb.ts`, `frontend/packages/contracts/src/index.ts` |
| Backend Creator/Bounty/Acceptance/Submission shapes differ from shared schemas | A real mobile API layer cannot safely consume responses | Backend route mappers and shared contracts |
| Upload descriptor says `TUS`, but its endpoint accepts no video bytes | Contracted mobile upload flow cannot work | `backend/src/routes/submissions.ts` |
| Current STT pipeline converts MP4 to MP3 with FFmpeg instead of sending the original video directly | Adds an unnecessary deprecated dependency and violates the binding processing design | Backend Submission/audio/ElevenLabs services |
| Admin routes do not apply `adminMiddleware` | Unauthenticated callers can perform admin, Payout, Review Round, and reset operations | `backend/src/routes/admin.ts`, `backend/src/index.ts` |

### P1 — required for a safe end-to-end Creator flow

| Blocker | Impact | Relevant areas |
| --- | --- | --- |
| `GET /v1/acceptances` is mounted to the Bounty router root | Canonical endpoint returns Bounties instead of Acceptances | `backend/src/index.ts`, `backend/src/routes/bounties.ts` |
| Backend and frontend use different fixture Creators and Bounties | IDs, visuals, and expected demo behavior drift | Both demo-data implementations |
| Creator middleware verifies JWTs but does not enforce the `CREATOR` role | Admin tokens can reach Creator routes | `backend/src/middleware/auth.ts` |
| Submission retrieval/creation do not consistently enforce resource ownership | Creators may access or reference another Creator’s workflow entities | `backend/src/routes/submissions.ts` |
| Demo login differs from the contract and there is no refresh/Meta exchange flow | Real auth and session restoration cannot be implemented safely | `backend/src/routes/auth.ts` |
| Relative upload endpoint conflicts with the shared absolute-URL schema | Upload descriptor parsing fails before transport begins | Backend upload mapper and `uploadDescriptorSchema` |
| Public Submission payloads/logs expose transcript/provider details | Violates the contract’s privacy boundary | Submission mapper/status compatibility route/provider adapter |

### P2 — required beyond the local demo

- Replace in-memory state with Supabase/Postgres and transactional persistence.
- Replace local public uploads with verified private object Storage.
- Implement Meta OAuth start/callback/exchange/refresh.
- Enforce `Idempotency-Key` behavior on contracted mutations.
- Normalize Multer/storage errors into canonical video validation errors.
- Prevent internal provider/error details from leaking through 500 responses.
- Replace automatic reviewer simulation with canonical `AI_PASSED -> IN_REVIEW -> SCORED` transitions.
- Define consistent units and balance updates for Payout/ledger entries.
- Add strict CORS/callback allowlists, provider timeouts/retries, structured redacted logs, and deployment health checks.

## Remaining delivery roadmap

### Stage 1 — Integration gate

1. Expand/freeze shared request and response schemas, enums, endpoint envelopes, and stable UUID fixtures.
2. Make Backend handlers validate and return those exact shared schemas.
3. Fix canonical routes, role guards, resource ownership, idempotency, and safe public mappers.
4. Implement private Supabase Storage plus a genuine signed TUS upload descriptor.
5. Replace FFmpeg with direct original-MP4 ElevenLabs `source_url` plus verified webhook processing.
6. Add automated contract tests for auth, profile, Bounties, Acceptances, Submissions, upload descriptors, and status transitions.

### Stage 2 — Real Creator mobile integration

1. Add runtime API URL configuration and the shared API/envelope/error client.
2. Add SecureStore access/refresh tokens, one refresh promise, and route guards.
3. Implement real demo auth first, then Meta OAuth in an Android development build.
4. Replace local Profile/Niche/Bounty/Acceptance state with Backend queries/mutations.
5. Implement real TUS upload progress, completion, polling, retry, and restored Active state.
6. Make Backend AI failure and processing-error states reachable in the UI.
7. Retain mocks only behind an explicit demo/local mode.

### Stage 3 — Reviewer and demo-admin web

1. Scaffold `frontend/apps/web` with reviewer/admin API clients and routes.
2. Build tokenized vertical Reviewer feed, signed playback, Rating upsert, and progress restoration.
3. Build Demo Admin login, developer uploader, candidate selection, QR/open/close controls, and reset.
4. Render the frozen Scoreboard, UGC buyout, Influencer multi-recipient Payouts, and ledger.

### Stage 4 — Persistence, deployment, and acceptance

1. Add Supabase migrations, seed data, private bucket/policies, persistent jobs, and guarded reset.
2. Complete Meta metrics ingestion, Review Round transactions, Scoreboard freezing, and Payout idempotency.
3. Deploy API/web/mobile configuration with exact origins and callback allowlists.
4. Run every scenario in `INTEGRATION_CONTRACT.md` on physical Android and independent reviewer devices.
5. Add the missing root README/demo script and document fallback/presentation operations.

## Immediate next actions

1. Resolve or intentionally commit the current unrelated mobile package/ESLint changes, then re-run mobile validation.
2. Make shared contracts and UUID fixtures the single Backend/frontend source of truth.
3. Fix Backend authorization, ownership, `/v1/acceptances`, and public mappers.
4. Implement genuine private TUS upload and object verification.
5. Remove FFmpeg and implement direct-video ElevenLabs asynchronous transcription.
6. Add contract tests before replacing `MockAppProvider`.
7. Connect mobile endpoint-by-endpoint, then build reviewer/admin web.

## Change log

### 2026-08-30 — Direct-video transcription and emulator smoke

- Confirmed from current ElevenLabs documentation that the STT convert API accepts video files/URLs directly and supports asynchronous webhooks with correlation metadata.
- Made direct original-MP4 transcription the binding architecture across master, frontend, Backend, integration-contract, and status docs.
- Marked the current FFmpeg/MP3 prototype path for removal; no Backend code was changed in this documentation task.
- Booted the Pixel 9 AVD, repaired ADB discovery, installed Expo Go, and successfully opened the mobile demo.
- Reconciled the remaining frontend/Backend roadmap into four delivery stages.

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
