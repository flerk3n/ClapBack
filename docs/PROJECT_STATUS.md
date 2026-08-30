# Clapback Project Status

> Canonical project snapshot for implemented capabilities, validation, integration blockers, and next actions.
>
> Last updated: 2026-08-30

## Executive summary

The polished Expo Creator app and the local Express Backend coexist in this repository. The mocked Creator journey runs successfully on the `Pixel_9` Android emulator. A single implementation owner now executes the work sequentially through Client and Trusted Platform gates; the existing technical, integration, frontend, Backend, and frontend README plans were updated to that model rather than adding another structure plan.

The local P0 contract and authorization gate is now substantially aligned after post-review fixes. Shared schemas, canonical Maya and Bounty fixtures, exact public mappers, role isolation, Acceptance routing, Submission ownership and idempotency, refresh-token separation, explicit credential configuration, and generic 500 responses all passed final schema-driven HTTP smoke validation. The active local multipart protocol is now explicitly documented separately from the unimplemented target signed-TUS profile. The Backend remains an in-memory local prototype, however, and real mobile integration is still blocked on private Supabase Storage, genuine signed TUS upload, durable jobs, and asynchronous ElevenLabs `source_url` webhook processing.

Local transcription now sends the original uploaded MP4 directly to ElevenLabs as multipart `file`; the FFmpeg/MP3 path is removed. This is an interim synchronous local path, not the durable architecture. The binding production design remains private original-video Storage, a short-lived signed `source_url`, and a verified idempotent asynchronous webhook.

| Area | Status | Summary |
| --- | --- | --- |
| Creator mobile UI | Mock demo working | Creator journey runs in Expo Go on the Pixel 9 emulator; current typecheck, lint, dependency, and Expo config checks pass |
| Shared frontend contracts | Local integration baseline implemented | Universal success envelopes, canonical demo auth/refresh schemas, the explicit local multipart Submission profile, core entities, and stable demo IDs parse the final local smoke flow |
| Backend runtime | Local contract prototype working | Express API builds and passes schema-driven auth, Bounty, Acceptance, idempotent Submission, role, ownership, privacy, refresh, media, credential-startup, and mock-processing checks |
| Frontend–Backend integration | Blocked on durable media path | Local wire shapes, multipart behavior, and security gates are aligned, but real mobile upload cannot proceed without private Storage and actual signed TUS |
| Durable infrastructure | Not implemented | State and uploads remain in-memory/local/public; Supabase, persistent jobs, TUS, and transcription webhooks are absent |
| Reviewer/admin web | Not implemented | `frontend/apps/web` remains reserved |

## Repository state

- Frontend implementation commit: `bbf62b1` — `feat(mobile): build polished creator bounty flow`.
- Pulled Backend commit: `2217107` — `feat(backend): implement platform plan, contract API, review rounds, and scoring`.
- Frontend/Backend merge commit: `858f141`.
- Project-status tracking commit: `0715509`.
- The three unrelated mobile edits in `frontend/apps/mobile/eslint.config.js`, `frontend/apps/mobile/package.json`, and `frontend/apps/mobile/package-lock.json` remain intentionally uncommitted and excluded from the intended focused P0 commit. Current mobile validation passes with all three present.

## Delivery ownership and sequencing

- One implementation owner now executes sequential Client and Trusted Platform gates instead of parallel Developer A/B tracks.
- `TECHNICAL_PLAN.md`, `docs/INTEGRATION_CONTRACT.md`, `docs/FRONTEND_APP_PLAN.md`, `docs/BACKEND_PLATFORM_PLAN.md`, and `frontend/README.md` now use that ownership model.
- The active local multipart protocol and target signed-TUS profile are now described separately, and stale current-FFmpeg/removal wording was corrected in `TECHNICAL_PLAN.md` and `docs/BACKEND_PLATFORM_PLAN.md`.
- No additional structure plan was created; those existing documents remain the planning sources.

## Implemented capabilities

### Creator mobile app

Location: `frontend/apps/mobile`

- Expo SDK 57 app with Android-first configuration and Expo Router.
- Restrained premium design language documented in `frontend/DESIGN_SYSTEM.md`.
- Demo Instagram sign-in and SecureStore-backed demo session token.
- Creator Profile confirmation and Niche selection.
- Swipeable Discover Bounty stack with Accept and Skip actions.
- Acceptance details, Payout display, and Active tasks.
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

### Shared contracts and demo data

Locations: `frontend/packages/contracts`, `frontend/packages/demo-data`

- Universal success envelopes use `{ data, meta: { requestId } }`.
- Canonical demo Creator login, demo admin login, and refresh request/response schemas are defined.
- The active local multipart Submission-create protocol and response schema are explicitly defined separately from the target signed-TUS profile.
- Core public Creator, Bounty, Acceptance, and Submission schemas are aligned with the Backend's exact public mappers.
- Demo data exports Maya's stable UUID: `ebf4b0b2-d96f-47d2-8f27-60139947f6b8`.
- The five canonical Bounties use stable UUID fixtures shared with the Backend.

Current shared-contract boundaries:

- The local multipart Submission profile describes the interim prototype; the separately documented signed-TUS profile remains unimplemented.
- Contract and fixture definitions remain duplicated across frontend and Backend source trees; consolidation or committed automated drift checks remain follow-up work.
- Durable upload, asynchronous webhook, real OAuth, and persistent refresh behavior still require their final schemas and integration tests as those platform capabilities are implemented.

### Backend API

Location: `backend`

- Express 5 API with request IDs, universal success envelopes, and generic global 500 responses.
- Canonical demo Creator/admin JWT issuance plus a minimal refresh JWT flow.
- Startup fails unless `JWT_SECRET`, `DEMO_CREATOR_PIN`, and `DEMO_ADMIN_PIN` are explicitly configured; `.env.example` contains non-working placeholders.
- Exact Maya fixture with UUID `ebf4b0b2-d96f-47d2-8f27-60139947f6b8` and five canonical Bounty UUID fixtures.
- Exact public Creator/Bounty/Acceptance/Submission mappers that omit transcript, storage, provider, reviewer, and `updatedAt` fields.
- Creator middleware enforces `CREATOR`; every admin operation after `/v1/admin/auth/login` enforces `DEMO_ADMIN`.
- Canonical `GET /v1/acceptances` returns owned Acceptances.
- Submission creation requires an owned authoritative Acceptance, derives Creator/Bounty from it, and never auto-accepts a Bounty.
- Local `POST /v1/submissions` requires `Idempotency-Key`: the same Creator/key replays the original Submission and deletes the duplicate uploaded file; a different key is rejected while that Acceptance has a non-failed Submission, while replacement remains available after `AI_FAILED` or `PROCESSING_ERROR`.
- Demo reset clears the in-memory Submission idempotency state along with other transactional state.
- Submission create, retrieval, and status routes enforce Creator ownership.
- Local multipart MP4 upload with a 100 MB limit and honest local response semantics; no fake TUS descriptor is returned.
- The local ElevenLabs path sends the original MP4 directly as multipart `file` with its real filename and MIME type.
- `TRANSCRIPTION_MODE` must explicitly be `mock` or `elevenlabs`; mock mode requires explicit `MOCK_TRANSCRIPT` content and has no hidden NovaSkin fallback.
- Bounty, Acceptance, Submission, review, Scoreboard, Payout, and ledger logic.
- Simulated reviewer scoring and ClapCoin ledger behavior.

Current Backend boundaries:

- Restarting the API clears all transactional and idempotency state.
- Uploaded files are local and publicly served from `/uploads`.
- The local multipart processing path is synchronous and is not suitable as the durable mobile integration architecture.
- Submission idempotency is local and in-memory; durable cross-restart replay protection is not implemented.
- The minimal refresh JWT is stateless and non-revocable; rotating persistent refresh sessions are not implemented.
- Demo PIN rate limiting is not implemented.
- Supabase/Postgres, private Storage, persistent jobs, actual TUS, Meta OAuth, and verified transcription webhooks are not implemented.
- No real ElevenLabs request or representative Android MP4 codec/container was validated.

## Direct-video transcription decision

The binding durable flow remains:

1. Mobile or admin web uploads the original accepted MP4 unchanged to private Storage through a genuine signed TUS flow.
2. Backend verifies the object and creates a short-lived signed read URL.
3. Backend sends that URL to ElevenLabs as `source_url`, enables asynchronous webhook delivery, and includes the Submission/correlation ID in `webhook_metadata`.
4. A verified, idempotent webhook stores the normalized transcript and queues Deliverable evaluation.
5. No client or server extracts audio, transcodes video, or creates a temporary MP3 in the normal path.

ElevenLabs documents direct audio/video file input, `source_url`, asynchronous webhooks, and webhook metadata in the [Speech-to-Text convert API](https://elevenlabs.io/docs/api-reference/speech-to-text/convert). Content from the linked documentation has been rephrased for compliance with licensing restrictions.

Completed local cleanup:

- Removed the FFmpeg/audio-extraction service and temporary MP3 lifecycle.
- Removed `fluent-ffmpeg` and `@types/fluent-ffmpeg` from Backend manifests and lockfile.
- Replaced audio-path transcription with direct original-MP4 multipart `file` upload using the real filename and MIME type.
- Made mock versus ElevenLabs processing explicit through `TRANSCRIPTION_MODE` and removed the hidden fixed NovaSkin fallback.
- Corrected stale current-FFmpeg and pending-removal wording in the technical and Backend platform plans.

Still required for the binding durable architecture:

- Implement private Supabase Storage and genuine signed TUS upload.
- Verify uploaded objects before transcription and issue short-lived signed read URLs.
- Implement asynchronous ElevenLabs `source_url` requests with Submission correlation metadata.
- Add a verified, replay-safe, idempotent webhook and persistent processing jobs.
- Add redacted structured provider logging, timeouts/retries, and representative Android MP4 validation.

## Validation record

### Mobile

Validated on 2026-08-30 after the final post-review gate fixes, with the three unrelated mobile package/ESLint edits still present:

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npx expo install --check` — passed; dependencies are up to date.
- `CI=1 npx expo config --type public` — passed; valid SDK 57 public configuration.
- Pixel 9 AVD boot, Expo Go installation, development bundle, and mocked journey — previously passed; the user reported the journey working in the emulator.

Still required:

- Decide whether to retain or revert the unrelated `eslint.config.js`, `package.json`, and `package-lock.json` edits before committing them.
- Complete a physical Android device review for permissions, video playback, haptics, deep links, offline/error recovery, accessibility, and visual polish.
- Use an Android development build rather than Expo Go for real Meta OAuth/deep-link validation.

### Backend and repository

Validated on 2026-08-30 after the final post-review gate fixes:

- A semantic review initially returned `NEEDS_CHANGES` for a contract/runtime mismatch and duplicate Submission creation. Both High findings and predictable default credentials were fixed; shared-source duplication and the lack of committed automated tests remain follow-up constraints.
- `npm ci` — passed; 225 packages audited and zero vulnerabilities. Deprecation warnings remain for some transitive packages, and npm reported the `elevenlabs@1.59.0` package-move notice.
- `npm run build -- --noEmit` — passed after the post-review fixes.
- Mobile `npm run typecheck` — passed after the post-review fixes.
- `git diff --check` — passed after the post-review fixes.
- The final local schema-driven HTTP smoke run passed.
- The final smoke run parsed Creator login, five Bounties, Acceptance create/list, Submission create/status, admin login, and refresh responses through shared Zod schemas.
- The final smoke run verified the exact five Bounty IDs, idempotent Acceptance behavior, same-key Submission replay, the different-key active-Submission guard with an HTTP 409 assertion, exact UUID/idempotency-key constraints, duplicate/rejected-file cleanup with only one accepted file remaining, invalid-media handling, public-field privacy, Submission ownership denial, Creator/admin role isolation, refresh-token rejection on Creator endpoints, and explicit mock direct-media processing through `AI_PASSED`.
- Starting with the JWT/PIN environment variables unset failed immediately with `JWT_SECRET must be explicitly configured`, as intended.

Not validated:

- No real ElevenLabs call or representative MP4 codec/container validation.
- No actual TUS upload or Supabase Storage integration.
- No asynchronous transcription webhook.
- No committed automated Backend test suite or Backend lint configuration/script.

## Integration blockers

The prior local P0 issues for UUID fixtures, public shapes, Creator/admin role guards, canonical `/v1/acceptances`, Submission authority/ownership/idempotency, contract/runtime multipart alignment, predictable default credentials, fake TUS advertising, and FFmpeg processing are resolved and covered by the final smoke run. The remaining priorities are:

### P0 — must resolve before real mobile upload integration

| Blocker | Impact | Relevant areas |
| --- | --- | --- |
| Private Supabase Storage and a genuine signed TUS upload flow are not implemented | Mobile cannot perform resumable private video upload or receive a truthful durable upload descriptor | Backend storage/upload routes, mobile upload client, shared upload contracts |
| Durable transcription still lacks signed `source_url`, persistent jobs, and a verified idempotent webhook | The local synchronous multipart path cannot safely or reliably process real production Submissions | Backend transcription adapter, webhook route, job persistence |

### P1 — required for a safe end-to-end Creator flow

| Blocker | Impact | Relevant areas |
| --- | --- | --- |
| Refresh JWTs are stateless/non-revocable and Meta OAuth is absent | Real login, rotation, revocation, and safe session restoration are unavailable | Backend auth, persistent session store, mobile auth client |
| Demo PIN endpoints have no rate limiting | Explicit secrets remove predictable defaults, but repeated credential guessing is not throttled | Backend Creator/admin auth routes |
| Workflow state, Submission idempotency, and uploads are in-memory/local/public | Restarts lose state and replay protection, and uploaded Creator media lacks durable private access control | Backend database/storage/idempotency layers |
| Contract behavior is covered only by manual local smoke scripts | Regressions in envelopes, roles, ownership, privacy, fixtures, idempotency, cleanup, and state transitions are not automatically prevented | Backend/shared-contract test suites |
| Contract and fixture sources remain duplicated | Frontend and Backend definitions can drift until they share one source or committed drift tests | Backend contracts/fixtures, frontend contracts/demo data |
| Contracted mutation-wide `Idempotency-Key` handling is incomplete beyond local Acceptance/Submission behavior | Other mutation retries can duplicate effects, and current Submission replay protection does not survive restart | Review, Payout, reset, and durable Submission mutations |
| Provider hardening and real-media validation are incomplete | Timeouts, retries, redaction, codec incompatibility, and provider failures remain unproven | ElevenLabs adapter, processing jobs, logging |

### P2 — required beyond the local Creator demo

- Replace automatic reviewer simulation with canonical `AI_PASSED -> IN_REVIEW -> SCORED` transitions.
- Define consistent units and balance updates for Payout/ledger entries.
- Add strict CORS/callback allowlists and deployment health checks.
- Build Reviewer/admin web experiences and persistent review/Payout workflows.
- Implement guarded reset, Meta metrics ingestion, Review Round transactions, and Scoreboard freezing.

## Remaining delivery roadmap

Work proceeds under one implementation owner through sequential gates.

### Gate 1 — Client contract baseline

Completed local baseline:

1. Added universal envelopes and canonical demo auth/refresh/local Submission schemas.
2. Stabilized Maya and the five Bounty UUID fixtures across demo data and Backend.
3. Aligned exact public mappers, canonical Acceptance routing, role guards, Submission authority/ownership/idempotency, explicit credentials, and generic internal errors.
4. Defined the active local multipart protocol separately from the target signed-TUS profile.
5. Proved the local flow, including Submission replay/guard/file cleanup and credential-startup behavior, with shared-schema HTTP smoke validation.

Remaining before the real Client connection:

1. Finalize durable upload/transcription schemas as the Trusted Platform capabilities are built.
2. Add committed automated shared-contract tests so the validated local baseline cannot regress.
3. Consolidate duplicated frontend/Backend contract and fixture sources or add committed drift checks.

### Gate 2 — Trusted Platform durability

1. Add Supabase migrations, canonical seed data, private bucket/policies, and persistent workflow state.
2. Implement genuine signed TUS upload, completion/object verification, and private playback access.
3. Implement persistent processing jobs and direct-video ElevenLabs signed `source_url` requests.
4. Implement verified idempotent transcription webhooks and safe normalized transcript storage.
5. Add rotating revocable refresh sessions, then Meta OAuth exchange/refresh.
6. Add durable mutation idempotency, PIN rate limiting, provider retries/timeouts, redacted logs, and automated integration tests.

### Gate 3 — Real Creator mobile integration

1. Add runtime API URL configuration and the shared API/envelope/error client.
2. Add SecureStore access/refresh tokens, one refresh promise, and route guards.
3. Replace local Profile/Niche/Bounty/Acceptance state with Backend queries/mutations.
4. Implement real TUS progress, completion, polling, retry, and restored Active state.
5. Make Backend AI failure and processing-error states reachable in the UI.
6. Validate real Meta OAuth/deep links and representative video processing in an Android development build and on a physical device.
7. Retain mocks only behind an explicit demo/local mode.

### Gate 4 — Reviewer, demo-admin, deployment, and acceptance

1. Scaffold `frontend/apps/web` with reviewer/admin API clients and routes.
2. Build tokenized Reviewer playback/rating/progress and Demo Admin upload/candidate/QR/round/reset controls.
3. Render frozen Scoreboard, UGC buyout, Influencer multi-recipient Payouts, and ledger.
4. Deploy API/web/mobile configuration with exact origins and callback allowlists.
5. Run every `INTEGRATION_CONTRACT.md` scenario on physical Android and independent reviewer devices.
6. Add the missing root README/demo script and document fallback/presentation operations.

## Immediate next actions

1. Begin the Trusted Platform durability gate with Supabase schema/seed data and private Storage policies.
2. Implement genuine signed TUS upload plus completion/object verification and freeze its shared schemas.
3. Implement persistent direct-video `source_url` jobs and the verified idempotent ElevenLabs webhook.
4. Add committed automated contract tests for the validated auth, refresh, Bounty, Acceptance, Submission idempotency/cleanup, role, ownership, privacy, credential-startup, and media behavior.
5. Consolidate duplicated contract/fixture sources or add committed drift checks.
6. Add rotating persistent refresh sessions, Meta OAuth, and PIN rate limiting before real session integration.
7. Connect the mobile app endpoint-by-endpoint only after the durable media gate is proven.
8. Resolve the three unrelated mobile package/ESLint edits before any commit that includes them.

## Change log

### 2026-08-30 — Single-owner P0 contract and local-processing gate

- Reframed the existing technical, integration, frontend, Backend, and frontend README plans around one owner executing sequential Client and Trusted Platform gates; no new structure plan was added.
- Added universal envelopes, canonical demo auth/refresh/local Submission schemas, stable Maya/five-Bounty fixtures, exact public mappers, role isolation, canonical Acceptances, authoritative owned Submission behavior, and generic global 500s.
- Replaced fake TUS advertising and FFmpeg/MP3 processing with honest local multipart MP4 handling, explicit transcription modes, direct original-video provider upload, and a minimal stateless refresh flow.
- A semantic review initially found a contract/runtime mismatch and duplicate Submission creation; both High findings were fixed by separating the active multipart and target signed-TUS profiles and requiring local Submission idempotency with replay, active-Submission conflict, and uploaded-file cleanup behavior.
- Removed predictable default JWT/PIN credentials by requiring explicit startup configuration and using non-working `.env.example` placeholders; PIN rate limiting remains a P1 hardening item.
- Corrected stale FFmpeg wording in `TECHNICAL_PLAN.md` and removal wording in `docs/BACKEND_PLATFORM_PLAN.md`; shared-source duplication and the lack of committed automated tests remain follow-up constraints.
- Passed final Backend build, mobile typecheck, repository whitespace, credential-startup failure, and schema-driven HTTP smoke validation covering exact fixtures, Acceptance and Submission idempotency, HTTP 409 active guards, file cleanup, invalid media, privacy, ownership, roles, refresh, and explicit mock processing; durable TUS, Supabase, real ElevenLabs media, and webhooks remain unvalidated and unimplemented.

### 2026-08-30 — Direct-video transcription and emulator smoke

- Confirmed from current ElevenLabs documentation that the STT convert API accepts video files/URLs directly and supports asynchronous webhooks with correlation metadata.
- Made direct original-MP4 transcription the binding architecture across master, frontend, Backend, integration-contract, and status docs.
- Marked the then-current FFmpeg/MP3 prototype path for removal; no Backend code was changed in that documentation task.
- Booted the Pixel 9 AVD, repaired ADB discovery, installed Expo Go, and successfully opened the mobile demo.
- Reconciled the remaining frontend/Backend roadmap into delivery stages.

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
