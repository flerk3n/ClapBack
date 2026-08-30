# Trusted Platform Plan

## 1. Layer responsibility

The Trusted Platform layer contains the authoritative platform capabilities:

- `services/api` — Fastify REST API, authentication, authorization, response envelopes, and job poller.
- `supabase` — PostgreSQL schema, migrations, seed data, private Storage bucket, and policies.
- server side of Meta OAuth and Instagram metrics ingestion.
- signed upload and playback access.
- ElevenLabs transcription and structured LLM Deliverable evaluation.
- Submission state transitions.
- anonymous Reviewer Sessions, Rating persistence, Review Round closure, Scoreboard calculation, and simulated Payout ledger.
- Trusted Platform deployment configuration and secrets.

The Trusted Platform layer follows [`INTEGRATION_CONTRACT.md`](./INTEGRATION_CONTRACT.md). It does **not** implement Expo screens, React pages, swipe behavior, video-player UI, local Client token storage, or visual loading/error states.

### Active demo gate

The immediate Trusted Platform target is the existing Express prototype, not the future Fastify/Supabase design: receive a real multipart MP4 on local disk, run direct ElevenLabs transcription and Gemini-backed Deliverable verification, open a Creator-owned in-memory Review Round after `AI_PASSED`, serve the QR-linked reviewer page and videos from the same process, accept anonymous 1–5 Ratings, then close the round and return the frozen Scoreboard. Supabase/Postgres, signed TUS, persistent jobs, asynchronous provider webhooks, Meta OAuth, a separate admin app, and production security hardening are explicitly deferred until this loop works.

## 2. File boundary

Trusted Platform work may edit:

```text
services/api/**
supabase/migrations/**
supabase/seed.sql
packages/contracts/**          for agreed contract implementation/changes
packages/demo-data/**          stable IDs and fixture data
backend deployment config
docs/BACKEND_PLATFORM_PLAN.md
```

Trusted Platform work does not edit:

```text
apps/mobile/**
apps/web/**
frontend presentation components
client route/navigation code
```

## 3. Backend technology choices

- Node.js and strict TypeScript.
- Fastify for REST API and provider webhooks.
- Zod contracts imported from `packages/contracts`.
- Supabase-hosted PostgreSQL and private Storage.
- Supabase server SDK only inside the API.
- JOSE for app JWT signing/verification.
- PostgreSQL-backed persistent job table and lightweight poller; no Redis.
- ElevenLabs asynchronous speech-to-text from a signed video URL.
- Gemini or OpenAI structured JSON output for relevance evaluation.
- Pino structured logs with request/correlation IDs and redaction.

## 4. Non-negotiable backend rules

1. Validate every public request and response through shared schemas.
2. Return camelCase public JSON even though PostgreSQL uses snake_case.
3. Never return a database row directly from a handler.
4. Own all workflow state transitions and reject invalid transitions.
5. Own ClapScore, eligibility, Scoreboard, and Payout calculations.
6. Store money in integer cents.
7. Use database transactions for Acceptance uniqueness, Rating upsert, Review Round closure, reset, and Payout idempotency.
8. Keep provider/service secrets backend-only and redact them from logs.
9. Keep videos private and issue limited signed upload/read access.
10. Convert provider failures into canonical Clapback error codes.
11. Make provider webhook and mutation handlers safe under retries.
12. Do not add infrastructure that is unnecessary for the five-video demo.

## 5. Suggested backend architecture

```text
services/api/src/
  app.ts
  server.ts
  config/
  plugins/
    auth.ts
    database.ts
    errors.ts
    logging.ts
  modules/
    auth/
    creators/
    bounties/
    acceptances/
    submissions/
    processing/
    review/
    scoreboard/
    payouts/
    admin/
  providers/
    meta/
    elevenlabs/
    llm/
    storage/
  jobs/
    poller.ts
    handlers/
  shared/
    mapper.ts
    idempotency.ts
    transitions.ts

supabase/
  migrations/
  seed.sql
```

Handlers should orchestrate. Domain modules enforce rules. Provider adapters isolate external payloads. Mappers produce shared public response models.

## 6. Phase-wise backend plan

## Trusted Platform Phase B0 — Contracts, server skeleton, and runtime configuration

**Goal:** provide a stable Trusted Platform shape that the Client layer can consume at the appropriate sequential gate.

1. Configure strict TypeScript and workspace imports.
2. Implement the canonical enums, request schemas, response schemas, and endpoints from `packages/contracts`.
3. Create environment validation for:
   - API origin and port;
   - web/mobile callback allowlists;
   - JWT signing material;
   - Supabase URL and service key;
   - database connection;
   - Meta credentials;
   - ElevenLabs credentials/webhook secret;
   - LLM credentials;
   - demo mode and demo admin PIN.
4. Fail startup on missing required production configuration.
5. Create Fastify application factory and server entry point.
6. Add request IDs, CORS allowlist, secure headers, payload limits, and Pino redaction.
7. Implement `/health/live` and `/health/ready` without exposing secrets.
8. Implement centralized envelope/error conversion.
9. Publish fixture-valid success/error examples for the Client layer.
10. Add route registration by domain.

**Next-gate input for Client layer:** base URL, contracts package, envelope examples, and current endpoint readiness.

**Next-gate input:** API starts with predictable validation, logging, and errors.

## Trusted Platform Phase B1 — PostgreSQL schema, private Storage, and fixed fixtures

**Goal:** create the authoritative state model and stable demo records.

1. Create SQL enum types matching canonical values.
2. Create tables:
   - `users`;
   - `creator_profiles`;
   - `niches`;
   - `creator_niches`;
   - `bounties`;
   - `bounty_niches`;
   - `bounty_acceptances`;
   - `submissions`;
   - `deliverable_checks`;
   - `processing_jobs`;
   - `review_rounds`;
   - review-round Submission join table;
   - `reviewer_sessions`;
   - `ratings`;
   - `scoreboard_entries`;
   - `payouts`;
   - refresh/session and idempotency tables where needed.
3. Add foreign keys, check constraints, uniqueness constraints, and cascade policy deliberately.
4. Add one-active-Acceptance uniqueness and one Rating per Reviewer Session/Submission.
5. Add indexes for Creator tasks, Submission status, ready jobs, Review Round ratings, and Payout lookup.
6. Create private `submissions` Storage bucket.
7. Deny public listing and permanent public object access.
8. Seed canonical Niches.
9. Seed four to six Bounties from `packages/demo-data` with stable UUIDs.
10. Seed demo Creators used by developer upload.
11. Implement guarded demo reset affecting only demo transactional rows.
12. Ensure migration and seed are repeatable on a clean project.

**Next-gate input for Client layer:** stable fixture IDs, Bounty assets/data, configured video constraints.

**Next-gate input:** authoritative database and private media store.

## Trusted Platform Phase B2 — Clapback sessions, roles, and demo authentication

**Goal:** secure Creator/Admin endpoints independently of Meta provider tokens.

1. Define Creator and Demo Admin app JWT claims.
2. Implement short access token issuance.
3. Implement rotating refresh tokens stored only as hashes.
4. Revoke replaced refresh tokens transactionally.
5. Implement bearer authentication plugin.
6. Implement Creator and Demo Admin role guards.
7. Implement `POST /v1/auth/refresh`.
8. Implement demo Creator login guarded by demo mode and PIN.
9. Implement Demo Admin login guarded by demo mode and rate limiting.
10. Return canonical `AUTH_REQUIRED`, `AUTH_EXPIRED`, `FORBIDDEN`, and demo-mode errors.
11. Ensure Creator and Demo Admin tokens cannot cross roles.
12. Ensure logs never contain tokens or PIN values.

**Next-gate input for Client layer:** auth/refresh behavior and safe demo credentials through a non-repository channel.

**Next-gate input:** both frontend clients can authenticate against stable app sessions.

## Trusted Platform Phase B3 — Meta OAuth, creator metrics, and eligibility

**Goal:** convert one approved Instagram professional account into a canonical Creator Profile.

1. Configure Meta Business app and Instagram API product.
2. Register backend HTTPS callback.
3. Implement `/v1/auth/meta/start`:
   - validate allowlisted `appRedirectUri`;
   - create cryptographically random state;
   - bind state to callback and expiry;
   - redirect to Meta.
4. Implement `/v1/auth/meta/callback`:
   - validate state once;
   - handle denial/cancellation;
   - exchange authorization code server-side;
   - fetch supported professional-account fields.
5. Normalize Meta fields into internal Creator Profile fields.
6. Upsert Creator by immutable Instagram user ID.
7. Compute ClapScore with one backend function:
   - below 10,000 -> `1.0`;
   - 10,000 through 49,999 -> `1.5`;
   - 50,000 or more -> `2.0`.
8. Compute Influencer eligibility using configured threshold and supported account type.
9. Initialize Trust Score to 100 for a new Creator.
10. Create a one-use `exchangeCode`, not an app token in the deep-link query.
11. Redirect to `clapback://oauth/callback?exchangeCode=...`.
12. Implement `/v1/auth/exchange` to consume once and return app tokens plus Creator Profile.
13. Discard Meta token after metrics fetch unless explicitly needed; if retained, encrypt backend-side.
14. Map unsupported account, unavailable metrics, cancellation, invalid state, and provider failure to canonical errors.
15. Implement `GET /v1/me` with a public mapper that excludes Instagram immutable ID/provider token.

**Next-gate input for Client layer:** exact callback URI registration, account requirements, and tested profile response.

**Next-gate input:** prepared Meta account signs in and produces expected eligibility/ClapScore.

## Trusted Platform Phase B4 — Niches, Bounties, and Acceptance domain

**Goal:** provide fixed discovery data and safe right-swipe behavior.

1. Implement `PUT /v1/me/niches`.
2. Validate `allNiches = true` has no individual IDs.
3. Validate `allNiches = false` has at least one valid Niche ID.
4. Replace Creator Niche rows atomically.
5. Implement `GET /v1/bounties` filtering by open status and Creator Niches.
6. Include UGC Bounties for every Creator.
7. Return Influencer Bounties with `creatorEligible` and reason; apply the agreed visibility policy consistently.
8. Compute and return `creatorPayoutCents`:
   - UGC: base amount;
   - Influencer: base amount multiplied by backend ClapScore with deterministic integer-cent rounding.
9. Return exact Deliverables and display deadline fixture text.
10. Implement Acceptance creation in a transaction.
11. Validate Bounty exists, is open, matches eligibility, and is not already accepted.
12. Return existing Acceptance for an idempotent duplicate.
13. Implement `GET /v1/acceptances` with latest Submission summary.
14. Never persist left swipes for the base demo.

**Next-gate input for Client layer:** `/me/niches`, Bounty list, Acceptance create/list plus all expected error examples.

**Next-gate input:** discovery and acceptance behavior is deterministic and idempotent.

## Trusted Platform Phase B5 — Submission creation and signed TUS upload

**Goal:** authorize private video upload while keeping clients out of Storage internals.

1. Define accepted MIME type and maximum size centrally.
2. Implement Submission creation request validation.
3. Verify Acceptance belongs to Creator and is active.
4. Enforce one current active Submission per Creator/Bounty according to contract.
5. Generate server-owned unique Storage path.
6. Create Submission in `CREATED`, then prepare signed TUS descriptor.
7. Move to `UPLOADING` when appropriate without trusting a client-provided status.
8. Return `UploadDescriptor` exactly.
9. Implement upload-complete:
   - lock Submission;
   - verify Creator ownership;
   - verify expected state;
   - inspect Storage object existence/size/type;
   - set `UPLOADED` then `QUEUED`;
   - create one `START_TRANSCRIPTION` job;
   - mark Acceptance `SUBMITTED`;
   - commit together.
10. Make upload-complete idempotent.
11. Implement `GET /v1/submissions/:id` using public mapper.
12. Implement replacement retry for `AI_FAILED` with a new Submission and Storage path.
13. Reject client-provided Storage paths and status fields.
14. Remove abandoned objects only through guarded cleanup/reset logic.
15. Prove the same Upload Descriptor works from Android and browser clients.

**Next-gate input for Client layer:** tested signed TUS descriptor, size/type limits, and Submission status examples.

**Next-gate input:** both upload clients can place valid private video and queue one processing job.

## Trusted Platform Phase B6 — Persistent jobs and direct-video ElevenLabs transcription

**Goal:** transcribe the original private MP4 asynchronously without adding Redis, FFmpeg, or derivative audio files.

1. Implement database job claim using a transaction and row lock/skip-locked behavior.
2. Store attempt count, lock time, available time, and safe last error.
3. Recover jobs whose worker lock was abandoned.
4. Add capped provider retries and terminal `PROCESSING_ERROR` behavior.
5. Handle `START_TRANSCRIPTION`:
   - validate Submission is `QUEUED`;
   - create a short-lived signed read URL for the original private MP4;
   - call ElevenLabs Speech-to-Text with that URL as `source_url`;
   - set `webhook = true` and attach the Submission/correlation ID through `webhook_metadata`;
   - set Submission `TRANSCRIBING` after provider acceptance.
6. Do not extract audio, transcode the video, or create a temporary MP3 in the base path.
7. Keep the completed local P0 removal of `audioExtractor`, `fluent-ffmpeg`, and `@types/fluent-ffmpeg`; do not reintroduce them when implementing the durable path.
8. Add an FFmpeg compatibility fallback only after representative Android MP4 files demonstrate a real unsupported-codec problem, and keep that fallback outside the normal path.
9. Implement ElevenLabs webhook:
   - verify provider signature or configured callback secret;
   - validate correlation metadata;
   - deduplicate callback event;
   - reject unknown Submission;
   - normalize and store transcript;
   - enqueue one `EVALUATE_TRANSCRIPT` job.
10. Convert final provider failure to canonical processing state and safe message.
11. Ensure signed URLs and provider payloads are redacted from logs.
12. Add admin-only reprocess for `PROCESSING_ERROR` that creates one new job safely.

ElevenLabs documents direct video/file input, `source_url`, asynchronous webhooks, and webhook metadata in the [Speech-to-Text convert API](https://elevenlabs.io/docs/api-reference/speech-to-text/convert). Content from the linked documentation has been rephrased for compliance with licensing restrictions.

**Next-gate input for Client layer:** observable status progression and safe processing errors.

**Next-gate input:** the original uploaded video becomes a persisted transcript or recoverable error without a local media-conversion dependency.

## Trusted Platform Phase B7 — Deliverable checks and AI filtering

**Goal:** reliably exclude random or incomplete videos from Review Rounds.

1. Load Bounty Deliverables and normalized transcript.
2. Run deterministic transcript prechecks:
   - minimum useful word count;
   - required exact codes after normalization;
   - keyword matching according to `MatchMode`;
   - required transcript not empty.
3. Persist deterministic Deliverable Check evidence.
4. If an exact mandatory check fails, skip unnecessary LLM approval and mark `AI_FAILED`.
5. For relevance checks, call the selected LLM with strict structured output.
6. Validate the LLM response through a server-side schema.
7. Require one result for every expected Deliverable.
8. Reject malformed or incomplete output into retryable job failure, not a guessed pass.
9. Compute final pass in backend code:
   - all required deterministic checks pass;
   - relevance passes;
   - configured confidence threshold passes.
10. Set `AI_PASSED` or `AI_FAILED` transactionally with Deliverable Checks.
11. Return a user-safe `failureMessage` such as a missing required code.
12. Never return chain-of-thought or provider prompts.
13. Exclude `AI_FAILED` and `PROCESSING_ERROR` from every review-candidate query.
14. Keep optional Gemini visual check feature-flagged and outside the critical path.
15. Validate prepared compliant and random videos against expected outcomes.

**Next-gate input for Client layer:** all terminal AI response examples with safe Deliverable evidence.

**Next-gate input:** only valid, relevant Submissions can reach reviewers.

## Trusted Platform Phase B8 — Anonymous Review Round, feed, and Rating APIs

**Goal:** persist ratings from a tokenized five-video public feed.

1. Add Review Round to Submission join table with unique membership.
2. Implement admin Review Round creation:
   - one Bounty only;
   - one through five distinct Submission IDs;
   - every Submission must be `AI_PASSED` and belong to Bounty;
   - initial status `DRAFT`.
3. Generate a high-entropy public token and store only its hash.
4. Implement open operation:
   - lock round;
   - ensure `DRAFT`;
   - set `OPEN`;
   - set selected Submissions `IN_REVIEW`;
   - return complete review URL.
5. Implement anonymous Reviewer Session creation/restoration using token hash.
6. Implement feed query for members only.
7. Generate temporary signed playback URL per item.
8. Expose only public Creator display data.
9. Implement Rating `PUT` upsert with integer 1–5 validation.
10. Enforce one Rating per Reviewer Session/Submission.
11. Reject Ratings when round is not `OPEN`.
12. Return updated rated/total count.
13. Implement progress endpoint.
14. Return `REVIEW_ROUND_NOT_FOUND`, `REVIEW_ROUND_NOT_OPEN`, and membership errors canonically.
15. Rate-limit public Rating requests without blocking normal five-item use.

**Next-gate input for Client layer:** raw review URL/QR target, open feed, Rating update, expired playback behavior.

**Next-gate input:** multiple anonymous devices can rate the same five Submissions safely.

## Trusted Platform Phase B9 — Transactional close and frozen Scoreboard

**Goal:** make **End deadline** produce an immutable, deterministic result.

1. Implement close operation in one transaction.
2. Lock the Review Round and reject/return existing result if already closed.
3. Stop accepting Ratings by changing status under the same lock.
4. Aggregate average and count for every member Submission.
5. Rank by:
   - average descending;
   - Rating count descending;
   - submitted-at ascending;
   - Submission ID ascending.
6. Define zero-Rating behavior explicitly; place unrated Submissions below rated ones with average `0`.
7. Write `scoreboard_entries` snapshot.
8. Mark member Submissions `SCORED`.
9. Mark Bounty `CLOSED` if the demo uses one round per Bounty.
10. Return the frozen Scoreboard in canonical response shape.
11. Implement public Scoreboard read only for closed round.
12. Implement admin Bounty result read including AI, Rating, rank, and Payout state.
13. Ensure a concurrent late Rating either commits before closure and is included or fails after closure; never partially include it.

**Next-gate input for Client layer:** deterministic closed response and populated Scoreboard examples.

**Next-gate input:** Review Round closure is repeatable, atomic, and presentation-safe.

## Trusted Platform Phase B10 — Simulated UGC and Influencer Payout ledger

**Goal:** prove the two business models without real-money infrastructure.

1. Implement UGC Payout endpoint:
   - require closed Bounty/Scoreboard;
   - require one selected Submission belonging to Bounty;
   - prevent a second UGC buyout for the same Bounty if single-winner policy applies;
   - calculate amount from authoritative Bounty rule;
   - create `UGC_BUYOUT` with `SIMULATED_PAID`.
2. Implement Influencer Payout endpoint:
   - require one or more selected Submissions;
   - verify each is eligible and belongs to closed Bounty;
   - calculate each from the stored Creator ClapScore snapshot/rule;
   - create one `INFLUENCER_REWARD` per Submission.
3. Use deterministic idempotency key per Bounty/Submission/Payout Kind.
4. Return existing Payout on duplicate request.
5. Never accept amount from frontend.
6. Add Payout data to admin results/ledger read.
7. Label records as simulated in public model.
8. Do not implement connected accounts, card collection, bank details, refunds, or live Stripe.

**Next-gate input for Client layer:** one UGC Payout and multiple Influencer Payout response examples.

**Next-gate input:** durable, non-duplicated simulated Payout records.

## Trusted Platform Phase B11 — Demo-admin operations and reset

**Goal:** expose every required operator action through safe APIs.

1. Implement demo fixture Creator list if needed by admin uploader.
2. Implement admin Submission creation using the same Storage/process flow as Creator uploads.
3. Implement processing-error requeue.
4. Implement candidate query showing only `AI_PASSED` Submissions.
5. Implement Review Round create/open/close operations.
6. Implement aggregate result read for admin table.
7. Implement guarded reset:
   - require Demo Admin;
   - require demo mode;
   - require exact confirmation;
   - delete only transactional demo rows and objects;
   - preserve migrations and fixture identities;
   - reseed known state.
8. Keep any emergency pre-passed fixture endpoint separately feature-flagged and clearly observable.
9. Return provider configured/not-configured health without values.

**Next-gate input for Client layer:** endpoint readiness matrix and expected reset result.

**Next-gate input:** demo operator never needs direct database access.

## Trusted Platform Phase B12 — Security, resilience, and deployment

**Goal:** make the compact architecture reliable enough for a live demo.

1. Add rate limits to OAuth starts, PIN login, upload creation, and public Ratings.
2. Add strict callback/deep-link allowlists.
3. Add MIME, size, object existence, and ownership checks.
4. Add timeout and capped retry policy for Meta, ElevenLabs, and LLM.
5. Add correlation ID from Submission through provider webhook and LLM job.
6. Redact Authorization, cookies, Meta/ElevenLabs/LLM keys, signed URLs, webhook secrets, and transcripts from routine logs.
7. Add database transaction boundaries around every multi-row state change.
8. Verify webhook replay safety.
9. Verify stale job lock recovery.
10. Verify no client can set `AI_PASSED`, rank, amount, role, or eligibility.
11. Configure deployed API CORS for exact web origin.
12. Configure backend callback URL with Meta and Android app callback allowlist.
13. Configure static web/reviewer base URL used in QR generation.
14. Add liveness/readiness checks that cover database connectivity without calling paid providers.
15. Keep one API process capable of serving requests and polling lightweight jobs; avoid extra services unless proven necessary.

**Next-gate input for Client layer:** deployed base URL, CORS origin confirmation, callback values, and health state.

**Next-gate input:** secure deployed platform with observable failure recovery.

## Trusted Platform Phase B13 — Integration and acceptance validation

**Goal:** prove real behavior against both clients and all critical demo paths.

1. Run each sequential gate in `INTEGRATION_CONTRACT.md` with both Client and Trusted Platform validations.
2. Parse every request and response through shared schemas.
3. Verify fixture IDs match database rows and frontend displays.
4. Verify Meta account metrics match `/v1/me`.
5. Verify low eligibility cannot Accept Influencer Bounty even with a forged request.
6. Verify duplicate Accept returns one Acceptance.
7. Verify TUS descriptor works from physical Android and web admin.
8. Verify duplicate upload-complete creates one job.
9. Verify prepared valid video becomes `AI_PASSED`.
10. Verify random/missing-code video becomes `AI_FAILED`.
11. Verify failed Submission cannot be inserted into Review Round.
12. Verify five valid Submissions appear in feed.
13. Verify one Reviewer Session upserts rather than duplicates a Rating.
14. Verify multiple Reviewer Sessions contribute independently.
15. Verify close freezes exact expected rank.
16. Verify late Rating is rejected after closure.
17. Verify one UGC and multiple Influencer Payouts persist without duplicates.
18. Verify reset restores stable fixture IDs.
19. Verify fallback demo login and pre-seeded closed round.
20. Verify no API response leaks private token, path, transcript, or provider payload.

**Prerequisite:** deployed clients and real callback origins.

**Next-gate input:** all trusted behavior satisfies the shared contract end to end.

## 7. Trusted Platform endpoint readiness board

A Trusted Platform endpoint is ready for the next Client gate only after request validation, response validation, authorization, canonical errors, and fixture data work.

| Endpoint group | Enables frontend work |
|---|---|
| Contracts/envelopes | all mock replacement |
| Demo auth + `/me` | session/profile UI |
| Meta start/callback/exchange | real Android onboarding |
| Niches/Bounties | profile completion and swipe cards |
| Acceptances | right swipe and Active tab |
| Submission/TUS | mobile/admin uploads |
| Submission read | processing status UI |
| ElevenLabs/LLM jobs | real AI pass/fail |
| Review Session/feed/Rating | public reviewer page |
| Admin Review Round | QR and deadline controls |
| Scoreboard | final ranking |
| Payout ledger | UGC/Influencer demo payments |
| Reset/health | repeatable presentation |

## 8. Trusted Platform acceptance checklist

Trusted Platform work is complete when:

- public payloads conform exactly to shared contracts.
- Creator and Demo Admin roles are isolated.
- Meta OAuth produces a Creator Profile and app tokens.
- ClapScore, eligibility, and creator payout are backend-calculated.
- fixed Bounties and Niches use stable fixture IDs.
- Acceptance and all mutations are idempotent.
- mobile and web upload through signed TUS descriptors.
- private videos are never made permanently public.
- persistent jobs survive request completion and process retries.
- transcript plus Deliverable checks reliably reject prepared random content.
- only `AI_PASSED` Submissions enter Review Rounds.
- Ratings are validated and unique per Reviewer Session/Submission.
- Review Round closure writes frozen deterministic Scoreboard Entries.
- UGC and Influencer Payouts use authoritative backend amounts.
- reset and fallback data make the demo repeatable.
- no secret or private provider data is returned or logged.
