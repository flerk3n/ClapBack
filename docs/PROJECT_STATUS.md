# Clapback Project Status

> Canonical project snapshot for implemented capabilities, validation, integration blockers, and next actions.
>
> Last updated: 2026-08-30

## Executive summary

Clapback is focused on one working demo loop rather than a production marketplace. The local path is: demo Creator sign-in -> Niche selection -> Bounty swipe/Acceptance -> real mobile MP4 upload -> visible transcription/AI stages -> QR-linked human review -> 1–5 Ratings -> Creator-controlled stop -> frozen video-wise Scoreboard.

Extra review videos now require no Bounty IDs, admin token, or upload command. The operator places two to four MP4 files directly in `backend/demo-videos/`. When the real Creator Submission reaches `AI_PASSED` and human review starts, the Backend automatically treats those folder files as pre-approved fixtures for that same Bounty and combines them with the Creator video. The Review Round remains capped at five videos total.

A finite local HTTP smoke passed this exact folder workflow in `TRANSCRIPTION_MODE=mock`: one real multipart Creator upload plus two folder MP4s produced a three-video feed, every video playback URL returned HTTP 200, a repeated start did not duplicate folder videos, Ratings of 5/4/3 were saved, and closing review returned the correct three-row Scoreboard. Backend/mobile builds and mobile lint pass.

| Area | Status | Summary |
| --- | --- | --- |
| Creator mobile | Demo path implemented; live runtime check pending | Existing screens call real local auth, Niche, Bounty, Acceptance, multipart upload, polling, review, and Scoreboard APIs |
| Upload and AI | Local path implemented | Creator MP4 runs through direct-video transcription mode and Deliverable verification |
| Extra demo videos | Implemented and folder-smoke-tested | Up to four alphabetically selected MP4s from `backend/demo-videos/` join the current Bounty automatically as pre-approved fixtures |
| Human review | Implemented and locally smoke-tested | Express serves vertical videos, brand asks, anonymous Ratings, and closed-round results at `/review/:token` |
| QR and Scoreboard | Implemented and locally smoke-tested | Backend generates QR data; mobile stops review and displays Backend-ranked video rows |
| Durable infrastructure | Deferred | Supabase, TUS, persistence, webhooks, OAuth, deployment hardening, and real payouts are outside the demo gate |

## Repository state

- Working demo-loop baseline: `37ce7d3` — `feat(demo): connect upload review and scoreboard loop`.
- Status metadata correction: `c9f8c55` — `docs(status): record committed demo loop`.
- The three pre-existing edits in `frontend/apps/mobile/eslint.config.js`, `frontend/apps/mobile/package.json`, and `frontend/apps/mobile/package-lock.json` remain unrelated and must stay outside focused demo commits.

## Active demo architecture

```text
Expo Creator app
  -> Express demo auth, Niches, Bounties, Acceptances
  -> real multipart Creator MP4
  -> local uploads/ + in-process transcription/verification
  -> AI_PASSED
  -> Creator starts human review
       + automatically load up to four backend/demo-videos/*.mp4 fixtures
  -> Backend-generated QR for /review/:token
  -> anonymous Ratings on vertical videos
  -> Creator stops review
  -> frozen video-wise Scoreboard in mobile
```

The Creator upload is the only video that runs through ElevenLabs and Deliverable verification. Folder MP4s are explicitly pre-approved demo fixtures. Local disk, public local playback, and in-memory state are deliberate demo choices.

## Implemented capabilities

### Creator mobile

Location: `frontend/apps/mobile`

- Backend demo login with SecureStore access/refresh token persistence.
- Backend-backed Niche selection, Bounty retrieval, Acceptance, and restoration.
- Existing swipe UI and stable Bounty visuals.
- Real MP4 selection, preview, XHR multipart upload, and byte progress.
- Polling of `QUEUED`, `TRANSCRIBING`, and `EVALUATING` to terminal AI state.
- Pipeline checks for upload, transcription, AI testing, and human-review readiness.
- Per-Deliverable evidence/confidence.
- QR rendering only after `AI_PASSED`.
- Openable review link, **Stop reviewing**, and frozen video-wise Scoreboard.

### Backend upload, AI, and folder fixtures

Location: `backend`

- Creator-owned multipart MP4 upload with 100 MB cap and Submission idempotency.
- In-process `QUEUED -> TRANSCRIBING -> EVALUATING -> AI_PASSED|AI_FAILED|PROCESSING_ERROR` progression.
- Original MP4 sent directly to ElevenLabs in `elevenlabs` mode; no FFmpeg.
- Structured Deliverable checks through deterministic phrase matching and Gemini/OpenAI/heuristic relevance evaluation.
- At review start, `DEMO_VIDEOS_DIR` defaults to `backend/demo-videos/` relative to the Backend working directory.
- The Backend reads regular `.mp4` files alphabetically and uses at most four.
- Folder files receive pre-approved Deliverable checks and join the real Submission's Bounty automatically.
- Repeating review start does not recreate or duplicate the folder candidates.
- Both normal uploads and folder MP4s are served through the existing `/uploads/<filename>` playback path.
- The obsolete admin multipart staging endpoint is removed.

### Human reviewer page

Location: `backend/public/review.html`

- Same-origin `/review/:token` page with no separate web build.
- Anonymous browser sessions without reviewer accounts.
- Full-height vertical scroll-snap feed for up to five videos.
- Brand, product, brief, and Deliverables shown before playback.
- 1–5 Rating upsert while the round is open.
- Frozen Scoreboard after the Creator stops review.
- Reviewer Session IDs are validated against the token's round.

## Folder usage

1. Put two to four real MP4s directly in:

   ```text
   backend/demo-videos/
   ```

2. Optional alphabetical naming controls order:

   ```text
   01-first.mp4
   02-second.mp4
   03-third.mp4
   ```

3. Upload the real Creator video in mobile and wait for `AI_PASSED`.
4. Tap **Start human review**. The folder videos are added automatically to that Bounty.
5. Scan the QR, rate the videos, and tap **Stop reviewing**.

Folder MP4s are ignored by Git. `backend/demo-videos/README.md` remains tracked. No Bounty ID or admin PIN is needed for this workflow.

## Configuration

Backend:

```env
PUBLIC_BASE_URL=http://<reachable-host>:3001
DEMO_CREATOR_PIN=1234
TRANSCRIPTION_MODE=mock|elevenlabs
DEMO_VIDEOS_DIR=demo-videos
```

Mobile:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
EXPO_PUBLIC_DEMO_CREATOR_PIN=1234
```

For physical reviewer phones, `PUBLIC_BASE_URL` must use the Mac's LAN address or an HTTPS tunnel. `localhost` and emulator-only `10.0.2.2` are not reachable from another phone.

## Validation record

Validated on 2026-08-30:

- `cd backend && npm run build -- --noEmit` — passed.
- `cd frontend/apps/mobile && npm run typecheck` — passed.
- `cd frontend/apps/mobile && npm run lint` — passed.
- Exact `qrcode` dependencies remain installed with zero reported vulnerabilities from the prior install.

Final folder-backed finite smoke verified:

1. Creator login, Bounty retrieval, and Acceptance.
2. Multipart Creator MP4 upload and polling to `AI_PASSED`.
3. Automatic discovery of `01-folder-demo.mp4` and `02-folder-demo.mp4` without admin authentication or a Bounty ID.
4. Idempotent repeated Review Round start with exactly three total videos.
5. Reviewer feed containing the Creator upload and both folder fixtures.
6. HTTP 200 playback for all three URLs, including files served directly from `demo-videos/`.
7. Ratings of 5, 4, and 3.
8. Frozen three-row Scoreboard with averages 5, 4, and 3 in rank order.
9. Cleanup of the temporary runner, folder fixtures, and generated Creator uploads.

Not yet validated:

- Real ElevenLabs transcription with a representative Android MP4.
- Real Gemini response in the integrated flow; smoke used deterministic phrases and heuristic fallback.
- Updated integrated journey running in Expo after API connection.
- QR scan and playback from an independent physical phone over LAN/tunnel.

## Remaining demo blockers

### P0 — complete before presentation

| Blocker | Impact | Next check |
| --- | --- | --- |
| Real provider path is untested | Mock mode proves orchestration but not ElevenLabs credentials, codec support, latency, transcript wording, or Gemini output | Run one prepared Android MP4 with ElevenLabs and Gemini keys |
| Integrated Expo journey has not been rerun | Static checks cannot prove picker permissions, XHR progress, navigation, polling, QR rendering, or Scoreboard layout | Run the complete Creator flow in the emulator/device |
| Cross-device QR reachability is unproven | A QR using `localhost` or `10.0.2.2` will fail on audience phones | Use LAN/tunnel `PUBLIC_BASE_URL` and scan from another phone |
| Presentation assets are not finalized | Missing or invalid folder videos would reduce the reviewer feed | Place and manually play the final 2–4 MP4 fixtures before the demo |

### P1 — useful but not required

- Add visible request errors and disable repeat taps on slower screens.
- Add distinct fixture Creator display names if the Scoreboard should show different people; it is currently video-wise and filenames distinguish rows.
- Add a simple reset control if repeated demos in one Backend process become cumbersome.
- Decide whether to retain or revert the unrelated mobile package/ESLint edits.

### Deferred production work

- Supabase Postgres/private Storage, signed TUS, durable jobs/idempotency, and verified webhooks.
- Meta OAuth, revocable sessions, rate limiting, strict CORS, and private playback.
- Separate admin/reviewer deployments, real payouts, moderation, and production observability.

## Immediate next actions

1. Place the final two to four MP4 fixtures in `backend/demo-videos/`.
2. Configure matching mobile/Backend Creator PIN and reachable API/public URLs.
3. Run the complete emulator flow in mock mode.
4. Run one prepared real MP4 through ElevenLabs and Gemini.
5. Scan the QR from an independent phone, rate all videos, stop review, and confirm the mobile Scoreboard.
6. Freeze the demo environment; do not resume production infrastructure work unless the demo requires it.

## Change log

### 2026-08-30 — Automatic folder-backed demo videos

- Removed the admin upload requirement for extra review videos.
- Added automatic, idempotent discovery of up to four alphabetically ordered MP4s from `backend/demo-videos/` when human review starts.
- Served folder MP4s through the existing playback route and ignored local fixture files in Git while tracking folder instructions.
- Updated configuration and active architecture documentation.
- Passed Backend build, mobile typecheck/lint, and a three-video folder-backed review/Scoreboard smoke with all playback URLs returning 200.

### 2026-08-30 — Working local upload-to-scoreboard demo loop

- Connected Expo to Backend auth, Bounties, Acceptances, real multipart upload, polling, QR review controls, and Scoreboard results.
- Added Creator-owned Review Round lifecycle, local QR generation, vertical reviewer HTML, anonymous Ratings, and frozen video-wise ranking.
- Passed static validation and the initial two-video local review smoke.

### 2026-08-30 — Single-owner P0 contract and local-processing gate

- Aligned shared contracts/fixtures, exact public mappers, role isolation, canonical Acceptances, owned Submission behavior, explicit credentials, direct MP4 processing, and local idempotency.

### 2026-08-30 — Direct-video transcription and emulator smoke

- Confirmed direct-video ElevenLabs architecture, removed FFmpeg from the normal path, and opened the then-mocked app in the Pixel 9 emulator.

### 2026-08-30 — Project status tracking

- Added this canonical status document and persistent maintenance guidance.

### 2026-08-30 — Backend retrieval and verification

- Pulled and merged the Backend implementation and passed initial build/health/auth/Bounty checks.

### 2026-08-30 — Creator frontend implementation

- Added the Expo Creator app, design system, mocked journey, shared contracts/demo data, and initial mobile validation.

## Maintenance rules

- Update this file after meaningful code, configuration, architecture, integration, or documentation changes.
- Record only completed or directly observed work; do not report planned work as implemented.
