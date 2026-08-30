# Clapback Demo: Feasibility and Phase-Wise Technical Plan

## 1. Feasibility verdict

**The requested demo is feasible, and the active goal is the shortest working happy path—not a production-ready marketplace.**

### Current demo-first delivery directive

Build and prove this sequence before any durability or security hardening:

1. Demo Creator sign-in, niche selection, and the existing Bounty swipe/Acceptance flow.
2. Real MP4 upload from the Expo app to the local Express Backend with visible upload and processing states.
3. Direct ElevenLabs transcription of the uploaded MP4, followed by Gemini 2.5 Flash Deliverable relevance verification. No alternate LLM or heuristic relevance fallback is allowed.
4. QR display only after `AI_PASSED`.
5. A public, Bounty-scoped vertical reviewer page that plays AI-passed videos, shows the brand ask, and accepts 1–5 Ratings.
6. A Creator-controlled **Stop reviewing** action that freezes and displays the video-wise Scoreboard in the app.

For this gate, local disk uploads, in-memory workflow state, demo PIN sign-in, one Express process, and a same-origin reviewer page are intentional. Supabase, signed TUS, persistent jobs, provider webhooks, Meta OAuth, a separate React admin app, production session hardening, and real payouts are deferred until this loop works in the demo environment.

The broader architecture below remains a future-production reference, not a prerequisite for the current demo gate. Brand management, public OAuth access, legal content-rights transfer, and movement of real money remain represented by fixed data and a mock payout ledger.

### Verified integration facts

- Meta's Instagram API with Instagram Login can return a professional account's username, account type, profile image, follower count, follow count, and media count. Advanced Access for users outside the app's assigned roles requires Meta App Review. The demo can use an app administrator/developer/tester account without waiting for public approval. See [Meta's Instagram API getting-started documentation](https://developers.facebook.com/docs/instagram/platform/instagram-api/get-started).
- Expo supports OAuth through `expo-auth-session`, but OAuth should be tested in an Android development build rather than Expo Go. Authorization-code exchange and Meta client secrets must stay on the backend. See [Expo authentication documentation](https://docs.expo.dev/guides/authentication/).
- Supabase supports resumable TUS uploads and recommends resumable upload for video-sized files or unreliable networks. See [Supabase resumable upload documentation](https://supabase.com/docs/guides/storage/uploads/resumable-uploads).
- ElevenLabs speech-to-text accepts common video formats directly, accepts a URL to the source video, and can return results asynchronously through a webhook. The base demo therefore does **not** need FFmpeg or a separate audio-extraction service. See [ElevenLabs speech-to-text API documentation](https://elevenlabs.io/docs/api-reference/speech-to-text/convert?explorer=true).
- Gemini can inspect video content directly if a bounty later needs visual checks such as confirming that a product appears on screen. This is an optional second AI gate rather than a base requirement. See [Gemini video understanding documentation](https://ai.google.dev/gemini-api/docs/video-understanding).
- Stripe Connect can split one platform charge into transfers to multiple connected accounts, but real payouts require connected-account onboarding, compliance, webhook handling, refunds, and negative-balance behavior. The demo should use a mock payout ledger. Stripe test mode can be added only after the core demo is stable. See [Stripe separate charges and transfers documentation](https://docs.stripe.com/connect/separate-charges-and-transfers).

Content from the linked documentation has been rephrased for compliance with licensing restrictions.

## 2. Demo scope contract

### 2.1 What will be real

1. Android creator onboarding through Meta OAuth using a known Meta app-role account.
2. Fetching and storing the creator's Instagram professional-account identity and follower metrics.
3. Calculating a ClapScore multiplier from follower count.
4. Selecting one or more niches, or selecting **All niches**.
5. Displaying fixed, code-owned brand bounty cards.
6. Accepting a bounty by swiping right or tapping an accessible accept button.
7. Selecting and uploading an MP4 from the Android device.
8. Persisting the video in a private Supabase Storage bucket.
9. Asynchronous speech-to-text and AI deliverable evaluation.
10. Excluding irrelevant or non-compliant submissions from the reviewer feed.
11. Opening a QR-linked vertical video review page.
12. Sending reviewer ratings to the backend.
13. Closing a bounty from a developer/admin page and freezing its scoreboard.
14. Recording simulated UGC or influencer payouts in a backend ledger.

### 2.2 What will be fixed or mocked

1. Brand accounts and brand authentication.
2. Bounty creation and editing.
3. Brand card content, artwork, deliverables, niches, rates, and deadline state.
4. Real payment collection, connected-account onboarding, bank payouts, refunds, and tax reporting.
5. Legally binding UGC rights transfer.
6. Public reviewer identity verification and reviewer rewards.
7. Meta App Review for arbitrary public Instagram accounts.
8. Push notifications; status is refreshed in-app and can optionally use Supabase Realtime.

### 2.3 What will not be built for this demo

- A production brand dashboard.
- A general-purpose bounty rules engine.
- Chat, comments, social following, or creator messaging.
- Camera recording and editing inside the app; creators choose an existing video.
- Up-swipe bookmarks unless the core loop is already complete.
- Automated content moderation beyond the bounty deliverable gate.
- A complicated microservice system, Redis, Kafka, Kubernetes, or multiple independent workers.
- Real-money Stripe payouts in live mode.

## 3. Recommended architecture

```text
Creator Android app (Expo / React Native)
        |
        | HTTPS + app JWT
        v
Node.js API (Fastify) ---------------------- React web app
        |                                    /review/:token
        |                                    /demo-admin
        |
        +---- Supabase Postgres
        +---- Supabase private Storage
        +---- Meta OAuth / Instagram API
        +---- ElevenLabs STT webhook
        +---- LLM deliverable evaluator

Admin browser -- /demo-admin -- QR code --> Reviewer phones
```

### 3.1 Repository shape

Use a small TypeScript monorepo so mobile, web, and API share IDs, enums, validation schemas, and demo bounty definitions.

```text
ClapBack/
  apps/
    mobile/                 Client layer: Expo Android Creator app
    web/                    Client layer: React + Vite reviewer and demo-admin pages
  services/
    api/                    Trusted Platform layer: Node.js + Fastify API and job poller
  packages/
    contracts/              Shared boundary: Zod schemas, API types, enums, endpoint constants
    demo-data/              Shared boundary: code-owned Bounty and Creator fixtures
  supabase/
    migrations/             Trusted Platform layer: SQL schema, constraints, indexes, policies
    seed.sql                Trusted Platform layer: upserts fixed demo Bounty IDs
  docs/
    demo-script.md              Exact presentation sequence and fallback path
    INTEGRATION_CONTRACT.md     Binding names, enums, payloads, and sequential gates
    FRONTEND_APP_PLAN.md        Client layer phase-wise implementation plan
    BACKEND_PLATFORM_PLAN.md    Trusted Platform layer phase-wise implementation plan
  basic.md
  TECHNICAL_PLAN.md
```

### 3.1.1 Single-owner sequential execution model

This master document remains the product and system design. One implementation owner executes the work sequentially across two architectural layers:

- **Client layer:** follow [`docs/FRONTEND_APP_PLAN.md`](./docs/FRONTEND_APP_PLAN.md) for the Expo Android Creator app plus the React reviewer and demo-admin web pages.
- **Trusted Platform layer:** follow [`docs/BACKEND_PLATFORM_PLAN.md`](./docs/BACKEND_PLATFORM_PLAN.md) for Fastify, Supabase, Meta's server-side flow, uploads, AI processing, Review Rounds, Scoreboard calculation, and the simulated Payout ledger.
- **Shared contract:** follow [`docs/INTEGRATION_CONTRACT.md`](./docs/INTEGRATION_CONTRACT.md) as the binding source for terminology, enums, JSON field names, endpoints, errors, state transitions, fixture IDs, money/timestamp formats, and sequential integration gates.

| Area | Client layer responsibility | Trusted Platform layer responsibility |
|---|---|---|
| Expo Android Creator experience | implements screens and interactions | supplies contract-valid APIs |
| React reviewer and demo-admin pages | implements screens and interactions | supplies contract-valid APIs |
| Swipe gestures, playback, QR display, UI state | implements | does not implement |
| API client, secure client token storage, TUS progress | implements | defines and validates protocol |
| Fastify routes and authorization | consumes | implements |
| Supabase schema, seed, and private Storage | does not edit | implements |
| Meta secret exchange and metrics ingestion | opens browser/deep link | implements |
| Submission state transitions | renders | enforces |
| ElevenLabs and LLM processing | renders status/results | implements |
| ClapScore, eligibility, ranking, Payout amounts | displays returned values | calculates authoritatively |
| Shared contracts and fixture IDs | imports and validates at consumption | implements and validates at production |

Rules that prevent integration bugs:

1. Use the canonical product nouns: **Creator**, **Bounty**, **Acceptance**, **Submission**, **Deliverable**, **Review Round**, **Reviewer Session**, **Rating**, **Scoreboard Entry**, and **Payout**.
2. Define wire types once in `packages/contracts`; neither layer keeps handwritten duplicate response interfaces.
3. Define stable demo IDs once in `packages/demo-data`; neither layer invents replacement IDs.
4. The Trusted Platform layer returns camelCase JSON, uppercase canonical enum values, integer cents, and UTC ISO timestamps.
5. The Client layer never calculates or guesses ClapScore, eligibility, final rank, AI pass/fail, or Payout amount.
6. The Trusted Platform layer never controls client loading/navigation behavior and never returns raw database or provider objects.
7. Contract changes are completed before either layer depends on them.
8. The Client layer may build against contract-validated mocks before the corresponding Trusted Platform endpoints are implemented.
9. Execution advances through the shared contract gates in order: contract, authentication, Bounty/Acceptance, upload/processing, review, and Scoreboard/Payout.

The detailed Phase 0–13 plan below still describes the full system. The layer-specific plans provide the sequential task order and preserve one clear architectural responsibility for each task.

Recommended package choices:

- Monorepo/package manager: pnpm workspaces.
- Mobile: Expo, Expo Router, `expo-auth-session`, `expo-web-browser`, `expo-image-picker`, `expo-video`, and a swipe/gesture library.
- Web: React, Vite, React Router, TanStack Query, native CSS scroll snap, and a small QR-code component.
- API: Node.js, Fastify, Zod, PostgreSQL client, Supabase server SDK, JOSE for app JWTs, and Pino logging.
- Data/media: Supabase Postgres and a private `submissions` Storage bucket.
- AI: ElevenLabs STT plus one structured JSON call to Gemini 2.5 Flash; no alternate model fallback.
- Deployment: one always-on Node service for both API traffic and the lightweight DB job poller, one static web deployment, and one Supabase project.

### 3.2 Why use a Node API instead of putting all logic in the clients

The Node API keeps the Meta client secret, ElevenLabs key, LLM key, and Supabase service key off mobile devices and browsers. It also centralizes authorization, signs upload/read URLs, validates webhook events, calculates scores, closes bounties transactionally, and writes immutable payout records.

### 3.3 Why FFmpeg is not in the base architecture

The ElevenLabs Speech-to-Text convert API accepts major audio and video formats as either a direct `file` upload or a `source_url`. With `webhook = true`, it returns early and delivers the transcription asynchronously; `webhook_metadata` can carry the Clapback Submission correlation ID. The base path therefore sends the original private MP4 through a short-lived signed `source_url` and does not create a derivative audio file.

Removing FFmpeg avoids a deprecated wrapper dependency, native binary deployment, temporary MP3 handling, format-conversion failures, and a second copy of every Submission. FFmpeg may be introduced only as a documented compatibility fallback after representative Android MP4 files demonstrate a codec/container problem that ElevenLabs cannot handle directly.

The pulled Express prototype originally converted MP4 to MP3 with `fluent-ffmpeg`. The local P0 gate removed that drift: the prototype now sends the original MP4 directly as multipart `file`, while the durable signed-`source_url`/webhook path remains the next platform gate.

Reference: [ElevenLabs Speech-to-Text convert API](https://elevenlabs.io/docs/api-reference/speech-to-text/convert). Content from the linked documentation has been rephrased for compliance with licensing restrictions.

## 4. Core demo data and rules

### 4.1 Fixed niches

Keep the list short and visually recognizable:

- Beauty
- Fashion
- Food
- Fitness
- Gaming
- Technology
- Lifestyle
- All niches

`All niches` is a UI choice stored as `all_niches = true`; it is not duplicated as a niche row.

### 4.2 Fixed bounty cards

Store the source fixtures in `packages/demo-data/src/bounties.ts` and upsert matching database rows with stable UUIDs. The app does not include a brand-creation interface. It fetches these seeded records from the API, which prevents the UI and backend from disagreeing about bounty IDs or deliverables.

Create four to six polished cards. At least one must be UGC and at least one must be influencer-only. Each card contains:

- stable bounty ID;
- brand name and logo asset;
- product name and image;
- bounty type: `UGC` or `INFLUENCER`;
- one or two niche tags;
- short creative brief;
- machine-checkable spoken deliverables;
- optional visual guidance that is not a hard gate in the base demo;
- accepted video type and size limit;
- base payout in integer cents;
- review round status;
- display-only deadline label.

Example machine-checkable deliverables:

- Say the brand name "GlowPop".
- Mention "20% off".
- Say the code "CLAP20".
- Keep the video relevant to skincare or the GlowPop product.

The required phrase design is intentional. It allows transcript-based filtering to reject random videos reliably without pretending that a text transcript can prove every visual detail.

### 4.3 Creator classification and ClapScore

Use one transparent function shared by API and UI:

```text
followers < 10,000       => 1.0x
10,000–49,999            => 1.5x
50,000 or more           => 2.0x
```

A creator is `INFLUENCER_ELIGIBLE` when all of the following are true:

1. Meta reports a professional account type.
2. A follower count is available.
3. The follower count meets the configured influencer threshold.

All authenticated creators may see UGC bounties. Only eligible creators may accept influencer bounties. An influencer can select any niche or all niches.

### 4.4 Scoreboard rule

Keep audience judging understandable:

```text
final_score = average of accepted 1–5 ratings
```

Ranking order:

1. higher average rating;
2. higher rating count;
3. earlier valid submission time;
4. stable submission ID as the final deterministic tie-break.

When the admin closes a bounty, the backend writes a scoreboard snapshot. Ratings after closure are rejected so the presented ranking cannot move.

### 4.5 Demo payout rules

- **UGC bounty:** the brand selects one ranked submission and clicks **Buy this video**. The backend records one mock payout to that creator.
- **Influencer bounty:** the brand selects one or more eligible submissions and clicks **Pay selected creators**. Each selected creator receives a separate mock payout of `base_payout × clap_score_multiplier`.
- Every payout is idempotent. Repeated button presses return the existing payout instead of creating duplicates.
- The UI must label these records **Demo payout** or **Simulated paid**. Do not imply that real funds moved.

## 5. Database model

### `users`

- `id uuid primary key`
- `role enum('creator', 'demo_admin')`
- `display_name text`
- `avatar_url text null`
- `created_at timestamptz`
- `updated_at timestamptz`

### `creator_profiles`

- `user_id uuid primary key references users`
- `instagram_user_id text unique`
- `instagram_username text`
- `instagram_account_type text`
- `followers_count integer`
- `follows_count integer null`
- `media_count integer null`
- `clap_score numeric(3,1)`
- `trust_score integer default 100`
- `influencer_eligible boolean`
- `all_niches boolean default false`
- `metrics_fetched_at timestamptz`

Do not persist a long-lived Meta token unless another demo feature actually requires it. If retained, encrypt it and keep it backend-only.

### `niches`

- `id smallint primary key`
- `slug text unique`
- `label text`

### `creator_niches`

- `creator_id uuid references users`
- `niche_id smallint references niches`
- composite primary key on both columns

### `bounties`

- `id uuid primary key` using stable fixture IDs
- `brand_name text`
- `brand_logo_url text`
- `product_name text`
- `product_image_url text`
- `type enum('UGC', 'INFLUENCER')`
- `brief text`
- `deliverables jsonb`
- `base_payout_cents integer`
- `status enum('OPEN', 'CLOSED')`
- `display_deadline text`
- `created_at timestamptz`

Each deliverable JSON item contains `id`, `label`, `kind`, `required`, `keywords`, and `match_mode`. Keep `kind` to `SPOKEN_PHRASE` or `RELEVANCE` for the base demo.

### `bounty_niches`

- `bounty_id uuid references bounties`
- `niche_id smallint references niches`
- composite primary key

### `bounty_acceptances`

- `id uuid primary key`
- `bounty_id uuid references bounties`
- `creator_id uuid references users`
- `accepted_at timestamptz`
- `status enum('ACTIVE', 'SUBMITTED', 'CANCELLED')`
- unique constraint on `(bounty_id, creator_id)`

### `submissions`

- `id uuid primary key`
- `bounty_id uuid references bounties`
- `creator_id uuid references users`
- `acceptance_id uuid references bounty_acceptances`
- `storage_path text unique`
- `original_filename text`
- `mime_type text`
- `size_bytes bigint`
- `duration_seconds numeric null`
- `status enum('CREATED','UPLOADING','UPLOADED','QUEUED','TRANSCRIBING','EVALUATING','AI_PASSED','AI_FAILED','PROCESSING_ERROR','IN_REVIEW','SCORED')`
- `failure_code text null`
- `failure_message text null`
- `transcript text null`
- `ai_summary text null`
- `ai_confidence numeric null`
- `created_at timestamptz`
- `submitted_at timestamptz null`

Allow one active submission per creator and bounty for the demo. A failed submission can be replaced by a retry while retaining the previous row for auditability.

### `deliverable_checks`

- `id uuid primary key`
- `submission_id uuid references submissions`
- `deliverable_id text`
- `passed boolean`
- `evidence text`
- `confidence numeric`
- unique constraint on `(submission_id, deliverable_id)`

### `processing_jobs`

- `id uuid primary key`
- `submission_id uuid references submissions`
- `type enum('START_TRANSCRIPTION','EVALUATE_TRANSCRIPT','OPTIONAL_VIDEO_CHECK')`
- `status enum('READY','RUNNING','SUCCEEDED','FAILED')`
- `attempt_count integer`
- `available_at timestamptz`
- `locked_at timestamptz null`
- `last_error text null`
- timestamps

A simple API-process poller claims one job transactionally. This keeps retries persistent without adding Redis.

### `review_rounds`

- `id uuid primary key`
- `bounty_id uuid references bounties`
- `public_token_hash text unique`
- `status enum('DRAFT','OPEN','CLOSED')`
- `max_submissions integer default 5`
- `opened_at timestamptz null`
- `closed_at timestamptz null`

Only the hash is stored. The raw high-entropy token appears in the QR URL.

### `reviewer_sessions`

- `id uuid primary key`
- `review_round_id uuid references review_rounds`
- `anonymous_token_hash text`
- `created_at timestamptz`
- unique constraint on `(review_round_id, anonymous_token_hash)`

### `ratings`

- `id uuid primary key`
- `review_round_id uuid references review_rounds`
- `reviewer_session_id uuid references reviewer_sessions`
- `submission_id uuid references submissions`
- `score smallint check (score between 1 and 5)`
- `created_at timestamptz`
- `updated_at timestamptz`
- unique constraint on `(reviewer_session_id, submission_id)`

### `scoreboard_entries`

- `review_round_id uuid references review_rounds`
- `submission_id uuid references submissions`
- `rank integer`
- `average_score numeric(4,2)`
- `rating_count integer`
- `snapshot_at timestamptz`
- composite primary key on `(review_round_id, submission_id)`

### `payouts`

- `id uuid primary key`
- `bounty_id uuid references bounties`
- `submission_id uuid references submissions`
- `creator_id uuid references users`
- `payout_kind enum('UGC_BUYOUT','INFLUENCER_REWARD')`
- `amount_cents integer`
- `status enum('SIMULATED_PAID')`
- `idempotency_key text unique`
- `created_by uuid references users`
- `created_at timestamptz`

## 6. API surface

All request and response bodies use shared Zod schemas. Creator routes require an app JWT. Admin routes require a demo-admin JWT. Public review routes require the unguessable review token and an anonymous reviewer cookie/token.

### Authentication and profile

- `GET /v1/auth/meta/start` — starts Meta authorization and stores signed state.
- `GET /v1/auth/meta/callback` — exchanges Meta's code server-side, reads Instagram profile fields, creates a one-use app exchange code, and redirects to `clapback://oauth/callback`.
- `POST /v1/auth/exchange` — exchanges the one-use code for an app access token and refresh token.
- `POST /v1/auth/refresh` — rotates the app refresh token.
- `POST /v1/demo/auth/login` — guarded by `DEMO_MODE` and a demo PIN; fallback only.
- `GET /v1/me` — returns identity, metrics, ClapScore, eligibility, and niche choices.
- `PUT /v1/me/niches` — atomically sets selected niches or `all_niches`.

### Bounties and upload

- `GET /v1/bounties` — returns open, niche-matched fixture bounties and creator-specific payout display.
- `POST /v1/bounties/:id/accept` — creates an idempotent acceptance after checking eligibility and open status.
- `GET /v1/acceptances` — returns active and submitted creator tasks.
- `POST /v1/submissions` — creates the submission row and returns a signed upload target.
- `POST /v1/submissions/:id/upload-complete` — verifies that the object exists, captures size/type metadata, and enqueues transcription.
- `GET /v1/submissions/:id` — returns upload and processing status plus user-safe rejection reasons.
- `POST /v1/submissions/:id/retry` — creates a replacement submission only for failed/error states.

### Provider webhook

- `POST /v1/webhooks/elevenlabs` — validates the callback, correlates it with a submission, persists transcript text, and enqueues transcript evaluation. It must be idempotent because providers can retry webhooks.

### Public review

- `POST /v1/review/:token/session` — creates or restores an anonymous reviewer session.
- `GET /v1/review/:token/feed` — returns at most five AI-passed videos, brand context, aggregate rating state, and short-lived signed playback URLs.
- `PUT /v1/review/:token/ratings/:submissionId` — upserts one 1–5 rating while the round is open.
- `GET /v1/review/:token/progress` — returns how many feed items the current reviewer has rated.
- `GET /v1/review/:token/scoreboard` — returns the frozen scoreboard only after closure.

### Demo admin

- `POST /v1/admin/demo/submissions` — creates a submission for a selected fixture creator and returns an upload target.
- `POST /v1/admin/submissions/:id/reprocess` — requeues a processing-error submission.
- `POST /v1/admin/review-rounds/:id/open` — selects up to five AI-passed submissions and returns the raw QR URL.
- `POST /v1/admin/review-rounds/:id/close` — closes ratings and writes the scoreboard snapshot in one transaction.
- `GET /v1/admin/bounties/:id/results` — returns AI status, ratings, rank, and payout state.
- `POST /v1/admin/payouts/ugc` — simulates buying one UGC submission.
- `POST /v1/admin/payouts/influencers` — simulates paying an array of selected influencer submissions.

## 7. State transitions

### Submission state machine

```text
CREATED -> UPLOADING -> UPLOADED -> QUEUED
QUEUED -> TRANSCRIBING -> EVALUATING
EVALUATING -> AI_PASSED -> IN_REVIEW -> SCORED
EVALUATING -> AI_FAILED
TRANSCRIBING/EVALUATING -> PROCESSING_ERROR
AI_FAILED/PROCESSING_ERROR -> creator starts a new retry submission
```

Every transition is enforced on the backend. Clients display state but cannot set it directly.

### Review round state machine

```text
DRAFT -> OPEN -> CLOSED
```

- `DRAFT`: admin prepares the candidate list; no public ratings.
- `OPEN`: QR feed works and ratings are accepted.
- `CLOSED`: new ratings are rejected and the scoreboard snapshot is visible.

### Payout state

The demo has one terminal payout state, `SIMULATED_PAID`. This is enough to show UGC single-winner and influencer multi-recipient behavior without inventing partial financial workflows.

## 8. Phase-wise implementation plan

## Phase 0 — Freeze the demo narrative and fixture contract

**Goal:** prevent attractive but unnecessary features from diluting the demonstrable loop.

1. Write the exact presentation path in `docs/demo-script.md`:
   - creator opens Android app;
   - creator signs in with the prepared Instagram professional account;
   - fetched username, follower count, and ClapScore appear;
   - creator chooses niches or All;
   - creator swipes through fixed bounty cards;
   - creator accepts one bounty and uploads a known valid video;
   - app displays processing state;
   - operator has placed two to four prepared MP4s in `backend/demo-videos/`;
   - creator starts human review and the app displays its QR code;
   - reviewers scan, scroll, and rate up to five videos;
   - creator taps Stop reviewing;
   - scoreboard appears in the app;
   - admin demonstrates one UGC buyout or multiple influencer payouts.
2. Define four to six stable bounty fixtures with stable UUIDs.
3. Make at least one prepared video pass and one prepared random/non-compliant video fail.
4. Ensure each hard-gated deliverable is audible and machine-checkable.
5. Decide one configured influencer threshold and keep it consistent in UI and API.
6. Prepare one Meta app-role professional account with metrics suitable for the intended eligibility path.
7. Define the fallback path: demo login, fixture metrics, prepared videos, and a manual reprocess button.
8. Record the scope exclusions from Section 2 in the repository README so they are not accidentally reintroduced.

**Exit criteria:** every screen, fixture, pass/fail example, and button used in the demonstration has a named purpose.

## Phase 1 — Scaffold the monorepo and shared contracts

**Goal:** establish one TypeScript contract across mobile, web, and API.

1. Create pnpm workspaces for `apps/mobile`, `apps/web`, `services/api`, and shared packages.
2. Enable strict TypeScript in every package.
3. Add shared enums for account eligibility, bounty type, submission status, review status, and payout status.
4. Add Zod schemas for every API request and response.
5. Add the ClapScore helper and payout calculation helper to `packages/shared`.
6. Add bounty fixture objects to `packages/demo-data`.
7. Configure environment validation in each application:
   - mobile receives only public API URL and public app identifiers;
   - web receives only public API URL;
   - API receives all private credentials.
8. Add formatting, lint, type-check, and build scripts without introducing a complex CI system.
9. Add a single development command for each app rather than one fragile command that hides all logs.

**Exit criteria:** all packages compile, shared schemas can be imported by each app, and no provider secret exists in mobile/web source.

## Phase 2 — Create Supabase schema, storage, and fixture seed

**Goal:** make the database the authoritative workflow state while keeping bounties code-owned.

1. Create SQL enums, tables, constraints, and indexes from Section 5.
2. Add indexes for:
   - creator's active acceptances;
   - submissions by bounty and status;
   - ready processing jobs by `available_at`;
   - ratings by round and submission;
   - payouts by bounty and creator.
3. Create the private `submissions` Storage bucket.
4. Deny public bucket listing and permanent public URLs.
5. Restrict writes to backend-generated signed upload targets.
6. Restrict playback to short-lived signed read URLs generated by the API.
7. Seed niche rows.
8. Upsert bounty fixtures with stable IDs from the code-owned fixture file.
9. Seed two or more fixture creators for the developer uploader and payout views.
10. Add a safe reset script that clears only demo transactional rows and re-seeds fixtures; require an explicit demo environment guard.

**Exit criteria:** a fresh Supabase project can be migrated and seeded repeatedly with the same fixed IDs.

## Phase 3 — Implement backend foundation and app sessions

**Goal:** provide a secure, observable API before building UI flows.

1. Create the Fastify server with request IDs, structured logs, CORS allowlist, centralized errors, and health endpoints.
2. Connect to Supabase Postgres and Storage through server-side credentials.
3. Implement short app access JWTs and rotating refresh tokens stored as hashes.
4. Add creator and admin authorization middleware.
5. Add idempotency handling for acceptance, webhook, round closure, and payout mutations.
6. Implement `GET /v1/me` and a fixture-based demo login.
7. Implement `GET /v1/bounties` with niche and influencer eligibility filtering.
8. Add a lightweight database job poller:
   - claim with a transaction and row lock;
   - mark `RUNNING`;
   - record attempts and errors;
   - use capped retries;
   - return exhausted jobs to visible `PROCESSING_ERROR` state.
9. Return stable machine-readable error codes alongside user-safe messages.
10. Redact tokens, signed URLs, transcripts, and provider payload secrets from logs.

**Exit criteria:** API authentication, profile reads, bounty reads, and persistent job claiming work without either frontend.

## Phase 4 — Implement Meta OAuth and metrics ingestion

**Goal:** turn an Instagram professional account into a Clapback creator profile.

1. Configure a Meta Business app and Instagram API product.
2. Register the backend HTTPS callback with Meta.
3. Configure the Expo app scheme `clapback://` and build an Android development client.
4. Implement `/auth/meta/start` with cryptographically random state tied to the requesting app session.
5. Open the backend authorization URL through `expo-auth-session`/`expo-web-browser`.
6. Receive Meta's callback on the backend; never send the Meta client secret to the app.
7. Exchange the authorization code server-side.
8. Fetch the professional account fields required for the demo: user ID, username, name, account type, profile picture, followers count, follows count, and media count.
9. Upsert `users` and `creator_profiles` keyed by the immutable Instagram user ID.
10. Calculate ClapScore and influencer eligibility on the backend.
11. Generate a one-use app exchange code and redirect to the `clapback://oauth/callback` deep link.
12. Exchange that one-use code for Clapback app tokens.
13. Handle these explicit outcomes in UI and API:
    - success with metrics;
    - account is not a supported professional account;
    - follower metrics unavailable;
    - creator cancelled login;
    - token exchange failed;
    - Meta service unavailable.
14. Keep a visible but secondary **Use demo creator** action guarded by demo configuration.
15. Display a disclosure that follower metrics are used for eligibility and payout display.

**Exit criteria:** the prepared Meta app-role account completes OAuth in the Android development build and its follower count drives the expected ClapScore.

## Phase 5 — Build creator onboarding and niche selection

**Goal:** complete the app's first-run state before bounty discovery.

1. Create the welcome screen with one primary **Continue with Instagram** action.
2. Add OAuth loading, cancellation, retry, and fallback states.
3. Create a profile-confirmation screen showing avatar, handle, account type, follower count, ClapScore, and influencer eligibility.
4. Avoid calling follower count “reach”; label it accurately.
5. Create a multi-select niche screen with the fixed niche list.
6. Make **All niches** mutually exclusive with individual choices.
7. Require at least one niche or All before continuing.
8. Persist the choice through `PUT /v1/me/niches`.
9. Restore the creator session and route returning users directly to discovery.
10. Add logout that clears local app tokens and returns to onboarding.

**Exit criteria:** new creator onboarding has no dead-end state and returning creators retain their profile and niche choice.

## Phase 6 — Build the fixed bounty swipe experience

**Goal:** demonstrate the core Tinder-style discovery interaction without a generic bounty system.

1. Fetch seeded cards through `GET /v1/bounties`.
2. Render a small card stack with brand image, bounty type, niche, deliverables, and creator-specific payout.
3. Show flat payout for UGC.
4. Show `base × ClapScore = creator payout` for influencer cards.
5. Implement right swipe as Accept and left swipe as Skip.
6. Add visible buttons for Accept and Skip so the flow does not depend on gesture recognition.
7. Do not persist left swipes; cycle or reset cards for repeatable demos.
8. On right swipe, call the idempotent acceptance endpoint.
9. If an ineligible creator reaches an influencer card, disable acceptance and explain the follower requirement.
10. On acceptance, show a bottom sheet with deliverables and two choices: **Upload now** and **View active task**.
11. Add an Active tab containing accepted/submitted tasks and processing status.
12. Provide a developer-only reset action from the admin web page, not the creator UI.

**Exit criteria:** a creator can accept a fixed bounty exactly once and reach its upload screen by gesture or button.

## Phase 7 — Implement Android video selection and resilient upload

**Goal:** get a real short-form MP4 into private storage with visible progress and recoverable errors.

1. Use `expo-image-picker` to select an existing video from the Android media library.
2. Request media permission only when the user taps Select video.
3. Validate before upload:
   - supported video MIME type;
   - configured maximum file size;
   - non-empty file;
   - optional duration range if reliable metadata is available.
4. Display a local video preview and file details.
5. Create the submission through the API and receive a unique storage path plus signed upload credentials.
6. Use Supabase's resumable TUS path for normal demo videos and expose progress percentage.
7. Keep each retry on a new storage path to avoid stale CDN/object conflicts.
8. Allow cancel and retry without creating duplicate active submissions.
9. Call `upload-complete` only after the storage upload reports success.
10. Have the API verify the object exists and matches declared size/type before queueing it.
11. Move the app immediately to a status screen instead of waiting for AI in the upload request.
12. Poll submission status with backoff; optionally subscribe to a realtime update later.
13. Translate backend states into creator-friendly labels:
    - Upload received;
    - Checking audio;
    - Checking deliverables;
    - Sent to reviewers;
    - Needs another attempt;
    - Processing problem—retry available.

**Exit criteria:** interruption, duplicate taps, and a failed upload do not create an apparently valid submission.

## Phase 8 — Implement AI filtering and transparent rejection

**Goal:** keep obviously irrelevant or incomplete videos out of human review without overclaiming AI certainty.

1. When upload verification succeeds, enqueue `START_TRANSCRIPTION`.
2. Generate a short-lived signed read URL for the private video.
3. Submit that URL to ElevenLabs STT in asynchronous webhook mode, correlated with submission metadata.
4. Mark the submission `TRANSCRIBING` and return control to the job poller.
5. On webhook:
   - validate authenticity or a secret callback token;
   - verify correlation ID;
   - ignore already-completed duplicate events;
   - store normalized transcript;
   - enqueue `EVALUATE_TRANSCRIPT`.
6. Run deterministic checks before the LLM:
   - all exact required codes/phrases appear after case/punctuation normalization;
   - reject an entirely empty transcript when transcript-based Deliverables exist.
7. Send the Bounty brief as context, plus individual Deliverables and the transcript, to the LLM with a strict JSON schema.
8. Require one result per Deliverable containing `passed`, `evidence`, and `confidence`.
9. Reject malformed model output rather than guessing; retry it as a processing error.
10. Use this pass rule:
    - every required spoken phrase passes deterministic matching;
    - every required Relevance Deliverable passes its LLM check;
    - confidence is explanatory evidence metadata, not a separate pass threshold.
11. Persist all criteria in `deliverable_checks`.
12. Mark compliant videos `AI_PASSED`; mark others `AI_FAILED` with a user-safe reason such as “The required code CLAP20 was not detected.”
13. Never show raw chain-of-thought. Show only evidence snippets and failed criteria.
14. Add an admin reprocess action for provider errors, not for genuine criterion failures.
15. Keep optional visual verification behind a feature flag:
    - upload/reference the video through Gemini video understanding;
    - ask only objective visual questions such as “Is a skincare product visible?”;
    - store visual checks separately;
    - do not block the base demo on this integration.
16. Confirm that `AI_FAILED` and `PROCESSING_ERROR` submissions are excluded from all reviewer queries.

**Exit criteria:** the prepared compliant video passes, the prepared random video fails, and only passed submissions can enter a review round.

## Phase 9 — Build the vertical reviewer web experience

**Goal:** let QR visitors rate a five-video feed with minimal friction.

1. Create `/review/:token` as a mobile-first route with no account signup.
2. Exchange the raw review token for an anonymous reviewer session stored in an HTTP-only cookie where deployment topology permits; otherwise use a browser-local random token sent over HTTPS.
3. Show a clear closed/invalid-round page for unusable tokens.
4. Fetch at most five AI-passed submissions from the opened round.
5. Render one full-viewport video per item using CSS scroll snap.
6. Autoplay only the active video, pause videos leaving the viewport, and start muted to satisfy browser autoplay rules.
7. Provide play/pause and mute controls.
8. Show concise brand and bounty context without exposing creator private data.
9. Add a prominent 1–5 star or numbered rating control.
10. Save each rating immediately through an idempotent upsert.
11. Optimistically update the UI but roll back and show retry if the request fails.
12. Show progress such as `3 of 5 rated`.
13. Let reviewers scroll backward and change a rating while the round remains open.
14. On completion, show a thank-you state and wait-for-results message.
15. Once closed, replace editing controls with the frozen scoreboard.
16. Refresh signed playback URLs when they expire instead of making the bucket public.

**Exit criteria:** scanning the QR on a fresh phone opens the feed, each submission can be rated once per reviewer session, and ratings reach the database.

## Phase 10 — Build the demo admin and developer uploader

**Goal:** give developers every control required to stage and operate the demo from one page.

1. Create `/demo-admin` behind a simple demo-admin login/PIN.
2. Add a bounty selector and show current bounty state.
3. Add a submission table with creator, AI status, failed criterion, rating count, score, and payout state.
4. Add a developer upload panel:
   - select fixture creator;
   - select bounty;
   - choose a video file;
   - upload with progress;
   - trigger the same processing pipeline as mobile.
4. Do not add a hidden direct-to-pass path as the normal flow. If a seed shortcut is retained for emergencies, label it clearly and protect it with a separate demo flag.
5. Add **Reprocess** only for processing errors.
6. Add candidate selection capped at five AI-passed submissions.
7. Add **Open review round** and display:
   - clickable review URL;
   - QR code;
   - count of selected videos;
   - live rating count.
8. Add a large, confirmation-protected **End deadline and freeze scores** button.
9. On confirmation, call the transactional close endpoint once.
10. Display the frozen ranking and tie-break details.
11. Add **Reset demo data** behind a typed confirmation phrase and environment guard.

**Exit criteria:** developers can upload all extra demo videos, form a five-video round, display a QR code, monitor ratings, and end the round without database access.

## Phase 11 — Implement scoreboard closure and simulated payouts

**Goal:** finish the brand-facing outcome with both requested payout modes.

1. Implement round closure in one database transaction:
   - lock the open round;
   - reject duplicate closure safely;
   - stop rating writes;
   - aggregate average and count;
   - apply deterministic tie-breaks;
   - write `scoreboard_entries`;
   - mark accepted submissions `SCORED`;
   - mark round and bounty closed.
2. Display rank, creator handle, average score, rating count, bounty type, and calculated payout.
3. For UGC:
   - allow selecting exactly one submission;
   - label the action **Buy this video (demo)**;
   - create one `UGC_BUYOUT` payout;
   - mark the chosen card paid and disable repeated purchase.
4. For influencer:
   - allow selecting multiple submissions;
   - calculate each amount independently from its creator's ClapScore snapshot;
   - create one `INFLUENCER_REWARD` payout per selection;
   - show a result summary listing all recipients and amounts.
5. Use deterministic idempotency keys based on bounty, submission, and payout kind.
6. Keep a simple ledger view so the demo can prove backend persistence.
7. Optionally add Stripe **test mode only** as a separate enhancement after the simulated ledger works. Do not make connected-account onboarding part of the core path.

**Exit criteria:** one UGC creator or multiple influencer creators can be marked paid, with durable and non-duplicated ledger records.

## Phase 12 — Add resilience, presentation polish, and observability

**Goal:** remove common demo failure modes without expanding product scope.

1. Add provider timeouts and capped retries for Meta, ElevenLabs, and the LLM.
2. Add correlation IDs from submission creation through transcription webhook and evaluation.
3. Add an admin-visible error summary without exposing secrets.
4. Add empty states, skeletons, upload progress, AI processing animation, pass/fail badges, and scoreboard celebration.
5. Preload card art and review poster frames.
6. Ensure Android back navigation cannot accidentally restart OAuth or duplicate acceptance.
7. Ensure browser refresh restores reviewer progress.
8. Ensure expired signed video URLs refresh cleanly.
9. Ensure a webhook arriving twice cannot create two evaluations.
10. Ensure ending the deadline while a rating request is in flight has deterministic behavior: the transaction that closes first wins, and a rejected late rating receives a clear closed response.
11. Hide all developer shortcuts when `DEMO_MODE` is false.
12. Add a provider health panel showing configured/not-configured rather than exposing credentials.

**Exit criteria:** known provider, network, refresh, duplicate-click, and expired-link failures have visible recovery paths.

## Phase 13 — Validate the complete demonstration against acceptance scenarios

**Goal:** verify the real result, not merely that builds complete.

### Creator scenarios

1. Prepared Instagram professional account signs in through Meta.
2. Username and follower count match Meta's response.
3. ClapScore and influencer eligibility match the configured thresholds.
4. Individual niche selection filters cards correctly.
5. All niches displays all otherwise eligible cards.
6. Low-eligibility creator cannot accept an influencer-only bounty.
7. Right swipe and Accept button create only one acceptance.
8. Valid MP4 uploads with visible progress.
9. Repeated upload-complete calls do not create repeated jobs.
10. Valid video reaches AI-passed/reviewer status.
11. Random or missing-code video reaches AI-failed status and explains the missing criterion.

### Developer/admin scenarios

1. Developer uploader creates additional submissions through the same AI pipeline.
2. Failed videos never appear in candidate selection.
3. Admin can select exactly five passed videos.
4. Review URL and QR code resolve on a device not logged into the admin app.
5. Admin can reprocess a provider failure.
6. Admin cannot re-open or re-close the same round into an inconsistent state.

### Reviewer scenarios

1. Five videos render as a vertical, snap-scrolling feed.
2. Only the active video plays.
3. Ratings persist after refresh.
4. One reviewer can update but not duplicate a rating for one submission.
5. Multiple devices contribute separate ratings.
6. Closed rounds reject new ratings and show final results.

### Scoreboard and payout scenarios

1. Average, count, and tie-break ordering match independently calculated expected values.
2. Closure freezes a persistent scoreboard snapshot.
3. UGC permits one simulated buyout.
4. Influencer bounty permits multiple simulated recipients.
5. Repeated payout requests do not duplicate ledger entries.
6. Every payout shown in UI matches integer-cent backend calculations.

### Fallback scenarios

1. Demo creator login works if Meta OAuth is unavailable.
2. Prepared videos are available locally to mobile and admin operators.
3. Processing errors can be requeued.
4. A pre-seeded closed round can be displayed if live reviewer devices fail.
5. Demo reset restores the same bounty and creator fixture IDs.

**Exit criteria:** each requested user-visible flow has been performed end to end using the deployed Android app, deployed web page, API, database, provider integrations, and fallback controls.

## 9. AI evaluator contract

Do not use the PRD's unrestricted “reply only YES or NO” prompt. A structured result is easier to debug and less likely to pass random content accidentally.

Conceptual request:

```json
{
  "bounty": {
    "brand": "GlowPop",
    "product": "Hydra Serum",
    "brief": "A short skincare recommendation",
    "deliverables": [
      { "id": "brand", "required": true, "text": "Say GlowPop" },
      { "id": "discount", "required": true, "text": "Mention 20% off" },
      { "id": "code", "required": true, "text": "Say CLAP20" }
    ]
  },
  "transcript": "..."
}
```

Required response schema:

```json
{
  "relevant": true,
  "relevanceEvidence": "The speaker discusses GlowPop skincare serum.",
  "checks": [
    {
      "deliverableId": "brand",
      "passed": true,
      "evidence": "GlowPop",
      "confidence": 0.99
    }
  ],
  "overallConfidence": 0.97,
  "summary": "All required spoken deliverables were detected."
}
```

The backend, not the model, computes final pass/fail from deterministic phrase checks and validated structured fields.

## 10. Security and privacy minimums

1. Keep all provider and Supabase service credentials on the API server.
2. Use state validation for OAuth and one-use exchange codes for the app deep link.
3. Store refresh tokens, review tokens, and anonymous reviewer tokens only as hashes.
4. Keep submission videos private and serve expiring signed URLs.
5. Validate MIME type, extension, size, and storage object existence.
6. Authorize submission access by creator ownership or admin role.
7. Prevent path injection by generating storage paths server-side.
8. Rate-limit OAuth starts, demo login, rating writes, and upload creation.
9. Do not log raw access tokens, signed URLs, or complete provider payloads.
10. Add creator consent copy for metric use and video review.
11. Delete or reset demo videos deliberately through the guarded demo reset path.
12. Label the payout as simulated and do not collect banking details.

## 11. Key risks and planned fallbacks

| Risk | Impact | Demo-focused mitigation |
|---|---|---|
| Meta public permissions are not approved | Arbitrary audience accounts cannot connect | Use prepared app-role professional account; retain clearly labeled demo creator fallback |
| Creator has a personal Instagram account | Professional metrics are unavailable | Explain requirement and offer demo creator |
| OAuth redirect fails in Expo Go | Login cannot return to app | Use an Android development build with configured app scheme |
| Large mobile upload is interrupted | Submission appears stuck | TUS resumable upload, progress UI, new-path retries |
| STT or LLM is slow/unavailable | Video remains processing | Persistent job state, capped retry, admin reprocess, prepared processed fallback round |
| Transcript-only AI cannot prove visual placement | Visual deliverable may be misclassified | Make spoken criteria the hard gate; keep Gemini video check optional and label visual guidance accordingly |
| LLM hallucinates a pass | Random video reaches reviewers | Deterministic required phrase matching plus structured relevance result and confidence threshold |
| Public reviewer link is shared | Extra anonymous ratings | Unguessable round token, one rating per browser session, admin closes round; acceptable for demo |
| Score changes during presentation | Ranking looks inconsistent | Transactional close and frozen scoreboard snapshot |
| Real payouts trigger compliance work | Core build becomes blocked | Mock ledger by default; Stripe test mode only as an isolated enhancement |

## 12. Final implementation boundary

The recommended demo is a real end-to-end media workflow, not a collection of disconnected mock screens:

```text
Meta creator -> metrics -> niche -> fixed bounty -> accept -> video upload
-> STT -> deterministic + LLM gate -> AI-passed queue
-> QR reviewer feed -> ratings -> close deadline -> frozen scoreboard
-> one UGC demo buyout OR multiple influencer demo payouts
```

Everything outside that line is optional. This boundary preserves the product idea while keeping the prototype small enough to implement, operate, and explain reliably.
