# Clapback Project Status

> Canonical project snapshot for implemented capabilities, validation, integration blockers, and next actions.
>
> Last updated: 2026-08-30

## Executive summary

Clapback is now focused on one working demo loop rather than a production-ready marketplace. The implemented local path is: Backend demo Creator sign-in -> Niche selection -> Bounty swipe/Acceptance -> real mobile multipart MP4 upload -> visible processing stages -> direct ElevenLabs transcription mode -> Deliverable verification with Gemini/OpenAI/heuristic fallback -> QR-linked human review -> 1–5 Ratings -> Creator-controlled stop -> frozen video-wise Scoreboard.

The current demo intentionally runs as one Express process with local public media, in-memory workflow state, and a dependency-free reviewer page served by the Backend. Private Supabase Storage, signed TUS, persistent jobs, provider webhooks, Meta OAuth, durable sessions, a separate React admin app, and production security hardening are deferred and do not block the demo.

A finite local HTTP smoke passed the complete two-video flow using `TRANSCRIPTION_MODE=mock`: a Creator MP4 reached `AI_PASSED`, an additional real MP4 was staged through the Backend admin endpoint, both appeared on the reviewer page/feed, separate Ratings were saved, and closing review returned a ranked two-row Scoreboard. Backend/mobile builds and mobile lint pass. A real ElevenLabs request, representative Android MP4, Expo UI run after this integration, and cross-device QR access still require live environment validation before presentation.

| Area | Status | Summary |
| --- | --- | --- |
| Creator mobile | Demo path implemented; runtime check pending | Existing polished screens now call real local auth, Niche, Bounty, Acceptance, multipart upload, Submission polling, review, and Scoreboard APIs |
| Upload and AI | Local path implemented | MP4 uploads to local disk; Backend runs direct-video transcription then Deliverable verification and exposes real processing states |
| Human review | Implemented and locally smoke-tested | Express serves `/review/:token` with vertical videos, brand asks, anonymous Ratings, and closed-round results |
| QR and Scoreboard | Implemented and locally smoke-tested | Backend generates QR data locally; mobile renders it, stops review, and displays Backend-ranked video rows |
| Additional demo videos | Implemented and locally smoke-tested | Admin can stage real playable MP4s that join the same-Bounty Review Round; staged videos are explicitly pre-approved fixtures |
| Durable/production infrastructure | Deferred | Supabase, TUS, persistence, webhooks, real OAuth, deployment hardening, and payouts are outside the current demo gate |

## Repository state

- Latest committed integration gate: `c5a404a` — `feat(backend): complete local P0 integration gate`.
- Current demo-loop implementation is present in the worktree and is not yet committed.
- Branch is currently two commits ahead of `origin/main` before any commit for this demo-loop work.
- The pre-existing edits in `frontend/apps/mobile/eslint.config.js`, `frontend/apps/mobile/package.json`, and `frontend/apps/mobile/package-lock.json` remain unrelated to this demo-loop implementation. They were not modified as part of the API/mobile/reviewer work and must remain separately reviewed.

## Active demo architecture

```text
Expo Creator app
  -> Express demo auth, Niches, Bounties, Acceptances
  -> multipart MP4 POST /v1/submissions
  -> local uploads/ + in-process processing
  -> ElevenLabs direct MP4 transcription (or explicit mock mode)
  -> Gemini/OpenAI/heuristic Deliverable verification
  -> AI_PASSED
  -> Creator starts Review Round
  -> Backend-generated QR for /review/:token
  -> anonymous browser Ratings on vertical same-Bounty videos
  -> Creator stops review
  -> frozen Backend Scoreboard in mobile
```

One process and local/in-memory state are deliberate demo choices. Client code does not calculate AI pass/fail or rankings.

## Implemented capabilities

### Creator mobile app

Location: `frontend/apps/mobile`

- Backend demo login with SecureStore access/refresh token persistence and one refresh retry.
- Backend-backed Niche selection, Bounty retrieval, Bounty Acceptance, and Acceptance restoration.
- Existing swipe UI and stable Bounty visuals retained.
- Real device/emulator MP4 selection and preview.
- XHR multipart upload with real byte progress and Backend-aligned MP4/100 MB validation.
- Polling of `QUEUED`, `TRANSCRIBING`, and `EVALUATING` until a terminal AI result.
- Pipeline completion checks for upload received, transcription, AI testing, and human-review readiness.
- Per-Deliverable evidence/confidence from the Backend.
- Human-review start only after `AI_PASSED`.
- Backend-generated QR image, selectable/openable review URL, and **Stop reviewing** control.
- Frozen video-wise Scoreboard with rank, filename, Creator, average Rating, and Rating count.
- Environment example for emulator API access and the demo Creator PIN.

### Backend upload and AI path

Location: `backend`

- Creator-owned local multipart MP4 upload with a 100 MB cap and Submission idempotency.
- In-process progression through `QUEUED -> TRANSCRIBING -> EVALUATING -> AI_PASSED|AI_FAILED|PROCESSING_ERROR`.
- Original MP4 sent directly to ElevenLabs when `TRANSCRIPTION_MODE=elevenlabs`; no FFmpeg or MP3 derivative.
- Structured Deliverable checks use deterministic spoken-phrase matching and Gemini/OpenAI/heuristic relevance evaluation.
- Creator-owned Review Round start/restore/close endpoints.
- Same-Bounty Review Rounds include the current video plus up to four additional `AI_PASSED` videos.
- Local QR generation through pinned `qrcode` dependencies; no external QR service.
- Closing a round is idempotent, freezes ranking, and marks member Submissions `SCORED`.
- Admin multipart staging endpoint stores a real playable MP4 as an explicitly pre-approved additional demo video.

### Human reviewer page

Location: `backend/public/review.html`

- Served by Express at `/review/:token` on the same origin as APIs and local video playback.
- Creates/restores an anonymous browser session without reviewer accounts.
- Full-height vertical scroll-snap feed for up to five same-Bounty videos.
- Shows brand, product, brief, and Deliverables before playback.
- Supports 1–5 Rating upsert per browser/video while the round is open.
- Pauses off-screen videos and provides explicit watch controls.
- Polls for round closure and renders the frozen Scoreboard.
- Reviewer APIs reject missing or cross-round Reviewer Session IDs.

### Shared contracts and configuration

- Shared Review Round, QR result, and Scoreboard Zod schemas/types were added.
- `PUBLIC_BASE_URL` controls the URL encoded into QR codes.
- `EXPO_PUBLIC_API_URL` controls mobile API access.
- `EXPO_PUBLIC_DEMO_CREATOR_PIN` must match the Backend demo Creator PIN.
- For a QR scanned by a physical phone, both public URLs must use the Mac's reachable LAN address or an HTTPS tunnel; `localhost` and Android-only `10.0.2.2` are not phone-reachable.

## Validation record

Validated on 2026-08-30:

### Static validation

- `cd backend && npm run build -- --noEmit` — passed after all Backend/reviewer/admin-staging changes.
- Backend dependency install for exact `qrcode@1.5.4` and `@types/qrcode@1.5.5` — passed; npm reported zero vulnerabilities.
- `cd frontend/apps/mobile && npm run typecheck` — passed.
- `cd frontend/apps/mobile && npm run lint` — passed after removing the effect-triggered immediate state update.
- `cd frontend/apps/mobile && CI=1 npx expo config --type public` — passed with SDK 57 configuration.
- `git diff --check` — passed.

### Finite end-to-end HTTP smoke

The final smoke used explicit local-only JWT/PIN values, `TRANSCRIPTION_MODE=mock`, and `MOCK_TRANSCRIPT='GlowPop 20% off CLAP20'`. It verified:

1. Creator login, Bounty retrieval, and Acceptance.
2. Multipart `creator.mp4` upload and polling to `AI_PASSED`.
3. Admin authentication and multipart staging of playable `competitor.mp4`.
4. An OPEN Review Round containing both same-Bounty videos.
5. A PNG QR data URL and HTTP 200 reviewer HTML page.
6. A reviewer session and two feed items with playback URLs and three brand Deliverables.
7. Separate Ratings of 5 and 3.
8. Creator-owned close operation.
9. Frozen Scoreboard rows ranked `creator.mp4` first at 5.0 and `competitor.mp4` second at 3.0, each with one Rating.
10. Cleanup of the temporary runner and both uploaded smoke files.

Not yet validated:

- Real ElevenLabs transcription with a representative Android-recorded/selected MP4.
- Real Gemini response in the integrated flow; the final smoke used deterministic phrases plus heuristic fallback.
- The updated integrated journey running in Expo on the Android emulator/device.
- QR scan and video playback from an independent physical reviewer phone over LAN/tunnel.
- Browser-specific autoplay/audio behavior on the presentation phones.

## Remaining demo blockers

### P0 — complete before presentation

| Blocker | Concrete impact | Next check |
| --- | --- | --- |
| Real provider path is not exercised | Mock transcription proves orchestration but not ElevenLabs credentials, MP4 compatibility, latency, transcript wording, or Gemini output | Run one prepared Android MP4 with `TRANSCRIPTION_MODE=elevenlabs`, `ELEVENLABS_API_KEY`, and `GEMINI_API_KEY` |
| Integrated Expo journey has not been rerun after replacing mocks | Typecheck/lint cannot prove picker permissions, XHR progress, navigation, polling, QR image rendering, or Scoreboard layout at runtime | Run the full Creator flow in the current emulator, then on the demo device |
| Cross-device QR reachability is unproven | A QR containing `localhost` or `10.0.2.2` will not open on audience phones | Set both public URLs to a LAN IP or HTTPS tunnel and scan from an independent phone |
| Presentation videos and exact spoken phrases are not finalized | Literal phrase checks can reject semantically correct transcription variants such as “twenty percent” versus `20%` | Record/choose prepared MP4s using the exact selected Bounty wording and verify their transcript once |

### P1 — useful demo follow-ups, not blockers for the first loop

- Add visible login/Niche/Acceptance request errors and disable repeat taps during slow requests.
- Add a tiny operator runbook or script for admin login and staging two to four additional real MP4s before opening review.
- Add alternate display names for staged videos if the presentation needs visually distinct Creators; current staging may reuse Maya while ranking remains video-wise.
- Decide whether to retain or revert the unrelated mobile package/ESLint edits before any commit that includes them.
- Add a simple reset control if repeated demos in one Backend process become cumbersome.

### Deferred production work

- Supabase Postgres/private Storage, signed TUS, object verification, durable idempotency, and persistent jobs.
- Asynchronous signed ElevenLabs `source_url` requests and verified webhooks.
- Meta OAuth, rotating/revocable sessions, rate limiting, strict CORS, and private playback URLs.
- Separate React reviewer/admin deployments, real payouts, moderation, and production observability.

These items are intentionally parked until the live demo loop is proven.

## Immediate next actions

1. Configure matching local Backend/mobile PIN and API/public URLs.
2. Run the integrated Creator flow in the existing Android emulator with mock mode to verify UI behavior.
3. Run one prepared real MP4 through ElevenLabs and Gemini; adjust only the selected Bounty's wording/normalization if transcription causes a false negative.
4. After the Creator video reaches `AI_PASSED`, stage additional real MP4s through the Backend admin multipart endpoint before tapping **Start human review**.
5. Scan the generated QR from an independent phone, rate every video, tap **Stop reviewing**, and confirm the same video-wise Scoreboard appears in mobile.
6. Freeze the demo environment and presentation assets; do not resume production infrastructure work unless the working demo requires it.

## Change log

### 2026-08-30 — Working local upload-to-scoreboard demo loop

- Reprioritized all plans around the shortest working demo and explicitly deferred production infrastructure.
- Connected the Expo Creator journey to Backend demo auth, Niches, Bounties, Acceptances, real multipart upload, status polling, QR review controls, and Scoreboard results.
- Added Creator-owned Review Round lifecycle endpoints, local QR generation, reviewer-session isolation, vertical reviewer HTML, anonymous Ratings, and frozen video-wise ranking.
- Replaced fake admin video metadata with real multipart MP4 staging for additional same-Bounty review videos.
- Passed Backend build, mobile typecheck/lint/Expo config, repository diff checks, and a finite two-video upload/review/Scoreboard smoke in explicit mock-transcription mode.
- Recorded real provider, integrated emulator, and physical-phone QR checks as the remaining presentation blockers.

### 2026-08-30 — Single-owner P0 contract and local-processing gate

- Reframed technical, integration, frontend, Backend, and README plans around one sequential owner.
- Added universal envelopes, canonical auth/refresh/local Submission schemas, stable fixtures, public mappers, role isolation, canonical Acceptances, authoritative owned Submission behavior, and generic global 500s.
- Replaced fake TUS advertising and FFmpeg/MP3 processing with honest local multipart MP4 handling, explicit transcription modes, direct original-video provider upload, and local Submission idempotency.
- Required explicit JWT/PIN startup configuration; PIN throttling remained deferred.

### 2026-08-30 — Direct-video transcription and emulator smoke

- Confirmed the direct-video ElevenLabs architecture and removed FFmpeg from the normal path.
- Booted the Pixel 9 AVD, installed Expo Go, and successfully opened the then-mocked mobile demo.

### 2026-08-30 — Project status tracking

- Added this canonical project status document and persistent workspace maintenance guidance.

### 2026-08-30 — Backend retrieval and verification

- Pulled and merged the Backend implementation, installed locked dependencies, and passed initial build/health/auth/Bounty checks.

### 2026-08-30 — Creator frontend implementation

- Added the Expo Creator app, design system, mocked Creator journey, shared contracts/demo data, and initial mobile validation.

## Maintenance rules

- Update this file after meaningful code, configuration, architecture, integration, or documentation changes.
- Record only completed or directly observed work; do not report planned work as implemented.
