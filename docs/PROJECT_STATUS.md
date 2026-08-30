# Clapback Project Status

> Canonical project snapshot for implemented capabilities, validation, integration blockers, and next actions.
>
> Last updated: 2026-08-30

## Executive summary

Clapback is focused on one working demo loop rather than a production marketplace. The local path is: demo Creator sign-in -> Niche selection -> Bounty swipe/Acceptance -> real mobile MP4 upload -> visible transcription/AI stages -> QR-linked human review -> 1–5 Ratings -> Creator-controlled stop -> frozen video-wise Scoreboard. The canonical fixtures now include a Uniqlo **Men's Outfit Haul** UGC Bounty whose required Deliverables are semantic men's T-shirt relevance and a deterministic video duration strictly under 1 minute.

Extra review videos require no Bounty IDs, admin token, or upload command. The operator places two to four manually curated Uniqlo men's T-shirt MP4s under 1 minute in `backend/demo-videos/`. When a real Uniqlo Submission reaches `AI_PASSED` and human review starts, the Backend treats those folder files as pre-approved fixtures and combines them with the Creator video. Other Bounties never load this folder. The Review Round remains capped at five videos total.

A finite local HTTP smoke passed the scoped workflow in `TRANSCRIPTION_MODE=mock`: six Bounties included Uniqlo, a real Uniqlo multipart upload preserved `durationSeconds: 29`, and its Review Round contained that upload plus the three existing folder MP4s. A GlowPop round in the same process contained only its Creator upload, proving the folder guard. A focused no-network verifier smoke confirmed that `tshirt`, `nice tee`, and `XYZ oversized T-shirt` pass at 80% confidence without brand, gender, fit, or styling language; outfit-only and empty transcripts fail; and unknown or exactly 60-second durations still fail. Backend/mobile builds and mobile lint pass.

| Area | Status | Summary |
| --- | --- | --- |
| Creator mobile | Demo path implemented; live runtime check pending | Existing screens call real local auth, Niche, Bounty, Acceptance, multipart upload with picker duration, polling, review, and Scoreboard APIs |
| Upload and AI | Local path implemented | Creator MP4 runs through direct-video transcription plus phrase, relevance, and deterministic maximum-duration Deliverable verification |
| Extra demo videos | Implemented and Bounty-scope-smoke-tested | Up to four alphabetically selected MP4s from `backend/demo-videos/` join only the Uniqlo Men's Outfit Haul Bounty as pre-approved fixtures |
| Human review | Implemented and locally smoke-tested | Express serves vertical videos, brand asks, anonymous Ratings, and closed-round results at `/review/:token` |
| QR and Scoreboard | Implemented and locally smoke-tested | Backend generates QR data; mobile stops review and displays Backend-ranked video rows |
| Durable infrastructure | Deferred | Supabase, TUS, persistence, webhooks, OAuth, deployment hardening, and real payouts are outside the demo gate |

## Repository state

- Working demo-loop baseline: `a6047bc` — `feat(demo): connect upload review and scoreboard loop`.
- Status metadata correction: `e45a7c0` — `docs(status): record committed demo loop`.
- Folder-backed review baseline: `e44feb0` — `feat(demo): load extra review videos from folder`.
- The three pre-existing edits in `frontend/apps/mobile/eslint.config.js`, `frontend/apps/mobile/package.json`, and `frontend/apps/mobile/package-lock.json` remain unrelated and must stay outside focused demo commits.

## Active demo architecture

```text
Expo Creator app
  -> Express demo auth, Niches, Bounties, Acceptances
  -> real multipart Creator MP4 + optional picker durationSeconds
  -> local uploads/ + in-process transcription/verification
  -> AI_PASSED
  -> Creator starts human review
       + for Uniqlo only, automatically load up to four backend/demo-videos/*.mp4 fixtures
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
- All-Niches profiles restore as mutually exclusive state; onboarding prevents duplicate saves and displays API failures without unhandled Promise rejections.
- Existing swipe UI and stable Bounty visuals, including Uniqlo Men's Outfit Haul.
- Real MP4 selection, preview, XHR multipart upload, picker-duration preflight, and byte progress.
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
- Structured Deliverable checks through deterministic phrase and maximum-duration matching plus Gemini 2.5 Flash relevance evaluation. Relevance has no alternate model or heuristic fallback.
- Relevance pass/fail is controlled only by each explicit required Deliverable; the brief is context, short non-empty transcripts are allowed, and confidence is display metadata rather than a threshold.
- Gemini output fails closed unless it contains exactly one valid check per expected Relevance Deliverable, boolean pass values, non-empty evidence/summary, and finite confidence values from 0 to 1.
- `MAX_DURATION` uses strict `<` semantics; the Uniqlo Creator upload must report a finite duration under 1 minute, while unknown or exactly 60 seconds fails.
- At review start, `DEMO_VIDEOS_DIR` defaults to `backend/demo-videos/` relative to the Backend working directory.
- The Backend reads regular `.mp4` files alphabetically and uses at most four only when the active Bounty is Uniqlo Men's Outfit Haul.
- Folder files receive pre-approved Deliverable checks and join the Uniqlo Bounty automatically; they are manually curated rather than media-probed.
- Internal review-fixture identity keeps those folder candidates out of Creator Acceptance `latestSubmission` restoration.
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

1. Put two to four manually verified Uniqlo men's T-shirt MP4s, each under 1 minute, directly in:

   ```text
   backend/demo-videos/
   ```

2. Optional alphabetical naming controls order:

   ```text
   01-first.mp4
   02-second.mp4
   03-third.mp4
   ```

3. Accept the Uniqlo Men's Outfit Haul Bounty, upload the real Creator video in mobile, and wait for `AI_PASSED`.
4. Tap **Start human review**. The folder videos are added automatically to the Uniqlo round; starting review for another Bounty never loads them.
5. Scan the QR, rate the videos, and tap **Stop reviewing**.

Folder MP4s are ignored by Git. `backend/demo-videos/README.md` remains tracked. No Bounty ID or admin PIN is needed for this workflow.

## Configuration

Backend:

```env
PORT=3001
PUBLIC_BASE_URL=http://<reachable-host>:3001
JWT_SECRET=<long-random-local-secret>
DEMO_CREATOR_PIN=1234
DEMO_ADMIN_PIN=<local-admin-pin>
TRANSCRIPTION_MODE=mock|elevenlabs
MOCK_TRANSCRIPT=<required-in-mock-mode>
ELEVENLABS_API_KEY=<required-in-elevenlabs-mode>
GEMINI_API_KEY=<required-for-relevance-deliverables>
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
- `git diff --check` — passed.
- Exact `qrcode` dependencies remain installed with zero reported vulnerabilities from the prior install.

Focused permissive Uniqlo verifier smoke verified:

1. `tshirt`, `nice tee`, and `XYZ oversized T-shirt` pass the `mens-tshirt` Relevance Deliverable without Uniqlo, men's, fit, or styling language.
2. A per-Deliverable pass at `0.8` confidence remains a pass even when a legacy mocked response includes top-level `relevant: false`; confidence is not a threshold.
3. The previous generic outfit-only transcript still fails because it does not establish a T-shirt, and an empty transcript fails before Gemini.
4. A passing T-shirt check with `durationSeconds: 59` passes the overall verifier.
5. The same T-shirt check with `durationSeconds: 60` or unknown duration fails only the strict duration Deliverable.
6. The smoke asserted `gemini-2.5-flash` selection and prompt criteria without making a live Gemini request.
7. Malformed checks—including string pass values, missing evidence/checks, out-of-range confidence, and empty summaries—fail closed as Gemini processing errors.

Focused Gemini-only configuration smoke verified:

1. A Relevance Deliverable rejects processing when `GEMINI_API_KEY` is missing instead of using another model or heuristic fallback.
2. Deterministic spoken-phrase verification still passes without invoking an LLM.
3. The Backend package has no OpenAI dependency.

Scoped local HTTP smoke verified:

1. Creator login, six-Bounty retrieval, and Uniqlo Acceptance.
2. Multipart Creator MP4 upload persisted `durationSeconds: 29` and reached `AI_PASSED`.
3. The Uniqlo Review Round contained the Creator upload plus all three existing `backend/demo-videos/` fixtures.
4. A GlowPop Creator upload also reached `AI_PASSED`, but its Review Round contained only that one upload.
5. Temporary smoke runners and generated Creator uploads were removed; existing operator fixture MP4s were preserved.
6. A focused in-memory identity smoke verified that a newer review fixture cannot replace the real Creator upload as an Acceptance's `latestSubmission`.

The prior end-to-end folder-backed review smoke remains valid and verified playback, idempotent review start, Ratings of 5/4/3, and the correctly ranked frozen Scoreboard.

Not yet validated:

- Real ElevenLabs transcription with a representative Android MP4.
- Real Gemini 2.5 Flash response in the integrated flow; no live API key was used during validation.
- Updated integrated journey running in Expo after API connection.
- QR scan and playback from an independent physical phone over LAN/tunnel.

## Remaining demo blockers

### P0 — complete before presentation

| Blocker | Impact | Next check |
| --- | --- | --- |
| Real provider path is untested | Mock mode proves orchestration but not ElevenLabs credentials, codec support, latency, transcript wording, or a live Gemini 2.5 Flash response | Run one prepared Android MP4 with ElevenLabs and Gemini keys |
| Integrated Expo journey has not been rerun | Static checks cannot prove picker permissions, XHR progress, navigation, polling, QR rendering, or Scoreboard layout | Run the complete Creator flow in the emulator/device |
| Cross-device QR reachability is unproven | A QR using `localhost` or `10.0.2.2` will fail on audience phones | Use LAN/tunnel `PUBLIC_BASE_URL` and scan from another phone |
| Presentation assets are not finalized | The three existing folder MP4s are loaded, but the Backend does not prove their duration or visual content | Manually confirm each final fixture shows a men's T-shirt, is under 1 minute, and plays before the demo |

### P1 — useful but not required

- Picker-reported duration is trusted in the controlled demo; forged multipart metadata could bypass a production duration policy.
- Men's T-shirt relevance is inferred from transcript/LLM text only; the Backend does not inspect video frames, so a visually shown T-shirt without a spoken transcript reference cannot pass the current check.
- Add visible request errors and disable repeat taps on slower screens.
- Add distinct fixture Creator display names if the Scoreboard should show different people; it is currently video-wise and filenames distinguish rows.
- Add a simple reset control if repeated demos in one Backend process become cumbersome.
- Decide whether to retain or revert the unrelated mobile package/ESLint edits.

### Deferred production work

- Supabase Postgres/private Storage, signed TUS, durable jobs/idempotency, and verified webhooks.
- Meta OAuth, revocable sessions, rate limiting, strict CORS, and private playback.
- Separate admin/reviewer deployments, real payouts, moderation, and production observability.

## Immediate next actions

1. Manually verify the final two to four Uniqlo men's T-shirt fixtures in `backend/demo-videos/` are under 1 minute and play correctly.
2. Configure matching mobile/Backend Creator PIN and reachable API/public URLs.
3. Run the complete emulator flow in mock mode.
4. Run one prepared real MP4 through ElevenLabs and Gemini.
5. Scan the QR from an independent phone, rate all videos, stop review, and confirm the mobile Scoreboard.
6. Freeze the demo environment; do not resume production infrastructure work unless the demo requires it.

## Change log

### 2026-08-30 — Permissive Deliverable-focused relevance

- Made required per-Deliverable Gemini checks authoritative instead of allowing a duplicate top-level relevance flag to reject an otherwise passing Submission.
- Allowed short non-empty transcripts and instructed Gemini to accept clear T-shirt/tshirt/tee wording without additional brand, gender, fit, or styling details; confidence remains display-only.
- Preserved Gemini 2.5 Flash-only evaluation, empty-transcript failure, and strict under-one-minute duration behavior.
- Passed Backend build, mobile typecheck/lint, and a no-network regression covering 80% confidence, short T-shirt mentions, outfit-only content, empty audio, duration boundaries, and fail-closed malformed Gemini output.

### 2026-08-30 — Men's T-shirt Uniqlo requirement

- Replaced the Uniqlo content requirement and Relevance Deliverable from a complete men's outfit to a men's T-shirt while preserving the stable Bounty identity and strict one-minute limit.
- Aligned Backend/mobile fixtures, mock-transcript guidance, and curated fixture instructions around the T-shirt requirement.
- Passed Backend build, mobile typecheck/lint, and a no-network fixture-parity/verifier smoke showing a T-shirt transcript passes while outfit-only content and exactly 60 seconds fail.

### 2026-08-30 — Niche onboarding state fix

- Normalized restored All-Niches profiles so expanded response Niches are not resubmitted as individual selections.
- Added guarded onboarding submission, loading state, and visible API error handling.
- Passed mobile typecheck, `git diff --check`, and lint with only the pre-existing `metric-block.tsx` warning.

### 2026-08-30 — Gemini 2.5 Flash-only verification

- Locked Relevance Deliverables to the stable `gemini-2.5-flash` model.
- Removed OpenAI and keyword-heuristic relevance fallbacks plus the OpenAI Backend dependency.
- Documented required Backend/mobile environment values and fail-closed behavior when Gemini configuration or output is invalid.
- Passed Backend build, dependency inspection, and focused missing-key/deterministic-check validation.

### 2026-08-30 — One-minute Uniqlo video limit

- Raised the Uniqlo Men's Outfit Haul maximum duration from 30 to 60 seconds.
- Renamed the Deliverable and aligned Backend/mobile fixtures plus folder instructions around a strict under-1-minute rule.
- Passed Backend build, mobile typecheck/lint, and focused boundary verification showing 59 seconds passes while 60 seconds fails.

### 2026-08-30 — Uniqlo outfit-haul demo Bounty

- Added matching Backend/mobile Uniqlo Men's Outfit Haul UGC fixtures and a stable mobile visual.
- Added first-class `MAX_DURATION` Deliverables, picker preflight, multipart duration persistence, and strict deterministic maximum-duration verification.
- Restricted `backend/demo-videos/` fixtures to Uniqlo and documented their manually curated duration requirement.
- Passed Backend build, mobile typecheck/lint, verifier boundary checks, and an HTTP smoke proving Uniqlo-only folder attachment.

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
