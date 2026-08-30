# Developer A Plan — Frontend/App

## 1. Role and ownership

Developer A owns every user-facing client:

- `apps/mobile` — Expo/React Native Android creator app.
- `apps/web` — React/Vite public reviewer page and demo-admin page.
- frontend-only UI components, navigation, animations, local state, query caching, secure client token storage, upload progress, video playback, and QR rendering.
- visual assets for fixed Bounty cards.
- contract-valid mock handlers used before real endpoints are ready.

Developer A must follow [`INTEGRATION_CONTRACT.md`](./INTEGRATION_CONTRACT.md). Developer A does **not** own database tables, workflow transitions, Meta secret exchange, ClapScore calculation, AI decisions, scoreboard calculation, or payout amounts.

## 2. File boundary

Developer A may edit:

```text
apps/mobile/**
apps/web/**
packages/ui/**                 if created
packages/contracts/**          only for an agreed contract change
packages/demo-data/**          only for agreed visual/fixture updates
docs/FRONTEND_APP_PLAN.md
```

Developer A should not edit:

```text
services/api/**
supabase/migrations/**
supabase/seed.sql
backend deployment configuration
provider webhook or AI worker code
```

This boundary avoids merge conflicts and prevents business logic from being duplicated in a client.

## 3. Frontend technology choices

### Mobile

- Expo with TypeScript and Expo Router.
- Android development build, not Expo Go, for Meta OAuth deep links.
- `expo-auth-session` and `expo-web-browser` for OAuth browser handoff.
- `expo-secure-store` for Clapback access and refresh tokens.
- `expo-image-picker` for selecting an existing video.
- `expo-video` for local preview and playback.
- React Native Gesture Handler/Reanimated or one maintained card-stack library for swipe behavior.
- TanStack Query for server state and polling.
- TUS client compatible with the backend's `UploadDescriptor`.

### Web

- React, Vite, TypeScript, and React Router.
- TanStack Query for API state.
- Native `<video>` elements with Intersection Observer.
- CSS scroll snap for the TikTok/Instagram-style vertical feed.
- A small QR component for `reviewUrl` returned by the backend.
- Shared API client, formatting helpers, and contract types with mobile where practical.

## 4. Non-negotiable frontend rules

1. Import response models and enums from `packages/contracts`; do not recreate them.
2. Use `Bounty`, `Acceptance`, `Submission`, `Review Round`, `Rating`, `Scoreboard Entry`, and `Payout` consistently.
3. Treat the backend as the authority for eligibility, ClapScore, creator payout, AI result, ranking, and payout amount.
4. Never infer workflow state from text, transcript presence, HTTP timing, or local upload state.
5. Never expose Meta tokens, provider payloads, Supabase service credentials, or permanent video URLs.
6. Send monetary values only when the contract explicitly requires them; payouts never accept a client-calculated amount.
7. Generate one idempotency key per logical mutation and reuse it while retrying that same mutation.
8. Disable repeated action taps while a mutation is pending, even though the backend is also idempotent.
9. Branch on stable API `error.code`, not error-message text.
10. Keep demo shortcuts visually labeled and hidden when demo mode is disabled.

## 5. App-wide frontend architecture

Recommended shared client modules:

```text
apps/mobile/src/
  api/
    client.ts                 auth headers, envelope parsing, errors
    auth.ts
    bounties.ts
    submissions.ts
  auth/
    token-store.ts
    session-provider.tsx
  features/
    onboarding/
    niches/
    bounties/
    acceptances/
    submissions/
  components/
  routes/

apps/web/src/
  api/
    client.ts
    review.ts
    admin.ts
  features/
    review/
    demo-admin/
    scoreboard/
  components/
  routes/

packages/ui/                 optional presentation-only components
```

Do not put API field conversion inside visual components. Parse the envelope once in the API layer and expose typed feature hooks.

## 6. Phase-wise frontend plan

## Frontend Phase A0 — Contract consumption and mock foundation

**Goal:** let mobile and web development start against payloads that the real backend will honor.

1. Configure workspaces for `apps/mobile` and `apps/web`.
2. Import canonical contracts and enums.
3. Create one API error class carrying `code`, `message`, `details`, and `requestId`.
4. Create a shared response-envelope parser.
5. Create contract-valid mock payloads for:
   - Creator Profile;
   - UGC and Influencer Bounties;
   - active Acceptance;
   - each Submission status;
   - open Review Round with five feed items;
   - closed Review Round with Scoreboard Entries;
   - single UGC and multiple Influencer Payouts.
6. Validate mock payloads through the actual Zod response schemas before exposing them.
7. Add a public runtime configuration value for API base URL and demo-mode visibility.
8. Do not place provider keys or a Supabase service key in frontend environment files.

**Backend dependency:** published contracts and fixture IDs.

**Frontend output:** mobile and web can render all planned states without an active API.

## Frontend Phase A1 — Shared UI language and visual system

**Goal:** make mobile, reviewer, and admin surfaces feel like one demo.

1. Define colors, spacing, radii, typography, badges, and button states.
2. Create formatting helpers:
   - cents to display currency;
   - ClapScore to `x` multiplier;
   - follower count abbreviation;
   - UTC timestamp to local display where needed;
   - rating average with fixed precision.
3. Create canonical status badges based on `SubmissionStatus`.
4. Create loading, empty, retryable-error, terminal-error, and offline components.
5. Keep status labels from the shared status-label map.
6. Build reusable brand/Bounty visual components without embedding acceptance logic.
7. Prepare local brand/product images whose fixture keys match `packages/demo-data`.

**Backend dependency:** none beyond shared enums.

**Frontend output:** every server state has a consistent visual representation.

## Frontend Phase A2 — API client, token handling, and navigation guards

**Goal:** establish reliable client/server communication once endpoints are available.

1. Implement API base URL handling for Android emulator/device and deployed web.
2. Parse only `{ data }` success and `{ error }` failure envelopes.
3. Attach Creator or Demo Admin bearer tokens to the correct clients.
4. Store mobile tokens in SecureStore, not AsyncStorage.
5. Implement one shared refresh promise so concurrent `AUTH_EXPIRED` responses do not race.
6. Retry the original request once after successful refresh.
7. Clear the session and route to welcome if refresh fails.
8. Keep anonymous Reviewer Session identity separate from Creator/Admin sessions.
9. Add route guards:
   - unauthenticated Creator -> mobile welcome;
   - authenticated Creator without niches -> niche selection;
   - fully onboarded Creator -> Bounty discovery;
   - invalid admin token -> admin login;
   - invalid review token -> invalid/closed review page.
10. Include request IDs in admin-facing error details.

**Backend dependency:** authentication, refresh, and standard error envelope.

**Frontend output:** all clients use one predictable auth/error policy.

## Frontend Phase A3 — Mobile Meta OAuth and creator onboarding

**Goal:** take a Creator from welcome to a confirmed Creator Profile.

1. Configure Expo app scheme `clapback`.
2. Configure the route handling `clapback://oauth/callback`.
3. Build welcome screen with **Continue with Instagram**.
4. Open backend `/v1/auth/meta/start` in the system browser.
5. Handle callback query `exchangeCode` exactly; do not expect a Meta access token.
6. Call `/v1/auth/exchange` and persist Clapback app tokens.
7. Render profile confirmation using backend fields:
   - avatar;
   - Instagram username;
   - account type;
   - follower count;
   - ClapScore;
   - Influencer eligibility.
8. Display follower count accurately; do not label it reach.
9. Handle `META_LOGIN_CANCELLED` without an alarming failure page.
10. Handle unsupported account and unavailable metrics with explanation and a secondary demo-creator action.
11. Build demo-creator picker only when demo mode is enabled.
12. Add logout and session restoration.
13. Verify Android back navigation cannot launch two OAuth flows.

**Backend dependency:** Meta start/callback, exchange, demo login, and `/v1/me`.

**Frontend output:** the prepared Instagram account and fallback Creator reach profile confirmation.

## Frontend Phase A4 — Niche selection

**Goal:** persist one or more Niches or All niches without ambiguous data.

1. Fetch the current Creator Profile.
2. Render the canonical niche list returned or shared by contract.
3. Make All niches mutually exclusive with individual Niches.
4. Require either `allNiches = true` or at least one `nicheId`.
5. Send `{ allNiches, nicheIds }` exactly.
6. Replace local profile cache with the returned Creator Profile.
7. Restore selections when revisiting the screen.
8. Show validation and retry behavior for network failure.
9. Route successful onboarding to Bounty discovery.

**Backend dependency:** `PUT /v1/me/niches`.

**Frontend output:** frontend and backend agree on niche state without an `all` pseudo-ID.

## Frontend Phase A5 — Bounty swipe discovery and Acceptance

**Goal:** implement the Creator's primary product interaction.

1. Fetch `Bounty[]` from `/v1/bounties`.
2. Render four to six polished cards with:
   - brand and product art;
   - Bounty Type badge;
   - Niche labels;
   - creative brief;
   - exact Deliverables;
   - backend-provided `creatorPayoutCents`;
   - display deadline.
3. Display UGC payout as a flat amount.
4. Display Influencer payout breakdown using returned ClapScore and payout; do not recalculate it.
5. Implement right swipe Accept and left swipe Skip.
6. Provide visible Accept/Skip buttons as a reliable alternative.
7. Keep left-swipe state local and resettable for repeatable demos.
8. On Accept, send one idempotent mutation.
9. Treat `ACCEPTANCE_ALREADY_EXISTS` as success using the returned Acceptance.
10. Use `creatorEligible` and `ineligibilityReason`; do not duplicate follower thresholds.
11. Show post-acceptance bottom sheet with **Upload now** and **View active task**.
12. Add Active tab backed by `/v1/acceptances`.
13. Ensure card animation rollback if acceptance fails.

**Backend dependency:** Bounty list, acceptance creation, acceptance list.

**Frontend output:** Creator reaches an active Acceptance exactly once.

## Frontend Phase A6 — Mobile video selection, preview, and TUS upload

**Goal:** upload a real Creator video without inventing server paths or states.

1. Enter upload from an Acceptance.
2. Request Android media permission only after user action.
3. Select an existing video with `expo-image-picker`.
4. Read MIME type, filename, size, and duration when available.
5. Apply frontend prechecks using backend-provided/configured limits for quicker feedback.
6. Show local video preview with replace/cancel controls.
7. Call `POST /v1/submissions` with Acceptance and file metadata.
8. Consume `UploadDescriptor` exactly:
   - use returned TUS endpoint;
   - send returned headers;
   - do not create storage path;
   - show byte/progress percentage.
9. Keep local upload progress separate from `SubmissionStatus`.
10. On TUS success, call `upload-complete` with the same idempotency key for retries.
11. Navigate to Submission status after backend acknowledges completion.
12. Support user cancellation before completion.
13. On upload failure, resume through TUS if possible; otherwise request a backend-authorized retry.
14. Never mark a Submission queued/passed locally.

**Backend dependency:** Submission creation, signed TUS descriptor, upload-complete.

**Frontend output:** selected MP4 reaches private Storage and backend processing.

**Transcription boundary:** mobile and web upload the accepted original MP4 unchanged. Frontend code must not extract audio, transcode media, install FFmpeg, or send a derivative MP3. The Backend passes a short-lived signed URL for the private video directly to ElevenLabs. The later label **Checking audio** describes speech-to-text analysis; it does not imply a client-side or server-side audio-extraction step.

## Frontend Phase A7 — Submission processing and retry experience

**Goal:** make asynchronous AI processing understandable.

1. Poll `/v1/submissions/:submissionId` with bounded backoff.
2. Pause polling for terminal statuses and while the app is backgrounded.
3. Map backend statuses through canonical labels:
   - `QUEUED` -> Waiting for checks;
   - `TRANSCRIBING` -> Checking audio;
   - `EVALUATING` -> Checking deliverables;
   - `AI_PASSED` -> Sent to reviewers;
   - `AI_FAILED` -> Needs another attempt;
   - `PROCESSING_ERROR` -> Processing problem;
   - `IN_REVIEW` -> With reviewers;
   - `SCORED` -> Results ready.
4. Display `failureMessage` for AI failure without exposing internal provider details.
5. Display Deliverable Checks with pass/fail and evidence when returned.
6. Allow replacement Submission flow for `AI_FAILED`.
7. Do not show creator reprocess control unless the contract explicitly supplies one.
8. Restore active status after app restart from Acceptance data.
9. Add pull-to-refresh as a manual fallback.

**Backend dependency:** Submission read and retry behavior.

**Frontend output:** Creator can wait, understand pass/fail, and replace a failed Submission.

## Frontend Phase A8 — Public vertical reviewer web page

**Goal:** allow QR visitors to rate five videos with no signup.

1. Create `/review/:token`.
2. Create/restore one anonymous Reviewer Session.
3. Fetch `ReviewFeed` only through the review API.
4. Render one viewport-height `ReviewFeedItem` at a time.
5. Use CSS scroll snap and Intersection Observer.
6. Play only the active video and pause all others.
7. Start muted, with visible mute and play controls.
8. Display brand/product context and Creator display identity returned by the API.
9. Add a 1–5 Rating control.
10. Optimistically update Rating but restore previous value if the API rejects it.
11. Show `ratedCount / totalCount`.
12. Allow Rating update while Review Round is `OPEN`.
13. Refresh feed if a temporary `playbackUrl` expires.
14. Never replace a signed URL with a public Storage URL.
15. Show thank-you state after all items are rated.
16. On closed round, disable Rating and fetch frozen Scoreboard Entries.
17. Handle invalid token, empty feed, closed round, and video playback failure.

**Backend dependency:** Reviewer Session, feed, Rating, progress, scoreboard endpoints.

**Frontend output:** a separate phone can scan QR, scroll videos, and persist Ratings.

## Frontend Phase A9 — Demo-admin web page and developer uploader

**Goal:** operate the entire demonstration without database access.

1. Create `/demo-admin` and Demo Admin login.
2. Add Bounty selector.
3. Render Submission table with canonical statuses.
4. Show Creator, AI result, failed Deliverable, Rating count, Scoreboard rank, and Payout state.
5. Build developer upload panel:
   - choose fixture Creator;
   - choose Bounty;
   - choose video;
   - receive the same `UploadDescriptor` shape;
   - show progress;
   - complete upload through the same processing pipeline.
6. Show Reprocess only for `PROCESSING_ERROR`.
7. Select at most five `AI_PASSED` Submissions for a Review Round.
8. Open Review Round and render backend-returned `reviewUrl` as text and QR.
9. Display live Rating count by refetching results/progress.
10. Add confirmation-protected **End deadline and freeze scores**.
11. Call close once and render returned frozen Scoreboard.
12. Add guarded reset UI requiring exact confirmation text.
13. Keep any emergency fixture shortcut clearly marked and hidden outside demo mode.

**Backend dependency:** all admin endpoints and upload descriptor.

**Frontend output:** one operator can stage, run, close, and reset the demo.

## Frontend Phase A10 — Scoreboard and simulated Payout UI

**Goal:** demonstrate both payout models without pretending real money moved.

1. Render frozen rank, average Rating, Rating count, Creator, and returned payout preview.
2. For UGC:
   - permit exactly one selected Scoreboard Entry;
   - show **Buy this video (demo)**;
   - send Bounty and Submission IDs only;
   - render returned Payout.
3. For Influencer:
   - permit multiple selected Scoreboard Entries;
   - show **Pay selected creators (demo)**;
   - send Bounty and Submission IDs only;
   - render all returned Payouts.
4. Use `amountCents` from Payout responses; do not recalculate.
5. Treat `PAYOUT_ALREADY_EXISTS` as a successful restoration of existing data.
6. Disable already-paid rows.
7. Label all outcomes **Simulated paid**.
8. Add simple Payout ledger panel to prove persistence.

**Backend dependency:** closed Scoreboard and payout endpoints.

**Frontend output:** UGC single buyout and Influencer multi-recipient Payouts are visibly distinct.

## Frontend Phase A11 — Integration hardening and demo validation

**Goal:** eliminate client-side causes of integration failure.

1. Replace every mock handler with the real endpoint one feature at a time.
2. Keep mock mode available only through an explicit local/demo flag.
3. Run all integration checkpoints in `INTEGRATION_CONTRACT.md`.
4. Verify Android deep links in a development build.
5. Verify API URL reachability from a physical Android device.
6. Verify mobile and web send exact enum values and field names.
7. Verify duplicate taps reuse idempotency keys.
8. Verify session refresh does not race.
9. Verify browser refresh preserves anonymous reviewer progress.
10. Verify late Rating receives closed-round UI rather than an unexplained error.
11. Verify expired playback URL causes feed refresh.
12. Verify app restart restores current Acceptance and Submission state.
13. Verify all demo fallbacks are visible only in demo mode.
14. Verify no frontend bundle contains provider or service-role secrets.
15. Run the complete presentation path against the deployed Backend.

**Backend dependency:** complete deployed API and seeded environment.

**Frontend output:** production-like demo clients connected to one canonical backend contract.

## 7. Frontend endpoint readiness board

Developer A can track backend handoffs using this order:

| Feature | Required endpoint group | Can build with mocks first? |
|---|---|---|
| Welcome/profile | auth exchange, `/me` | yes |
| Niches | `/me/niches` | yes |
| Swipe cards | `/bounties` | yes |
| Acceptance/Active tab | accept, `/acceptances` | yes |
| Mobile upload | Submission create/complete/read | UI yes; TUS requires backend |
| Processing status | Submission read/retry | yes |
| Reviewer feed | review session/feed/Rating | yes |
| Admin uploader | admin Submission upload | UI yes; TUS requires backend |
| Review Round controls | admin create/open/close | yes |
| Scoreboard | review/admin results | yes |
| Payouts | UGC/Influencer payout endpoints | yes |

## 8. Frontend acceptance checklist

Developer A's work is complete when:

- Android Creator can authenticate or use demo fallback.
- Creator Profile metrics and ClapScore display exactly as returned.
- Creator selects Niches or All niches.
- fixed Bounties swipe smoothly and Accept is idempotent.
- Creator selects, previews, and uploads a video with progress.
- every Submission status has accurate UI.
- AI failure shows actionable Deliverable feedback.
- QR reviewer page scrolls and Rates five videos.
- reviewer progress survives refresh.
- admin uploads extra videos and sees processing results.
- admin opens/closes a Review Round and displays QR.
- frozen Scoreboard renders backend ranking.
- UGC and Influencer demo Payout flows render returned ledger records.
- no backend calculation or secret has been duplicated in frontend code.
