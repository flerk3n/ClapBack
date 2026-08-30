# Clapback Shared Integration Contract

This document is the binding interface between two architectural layers executed sequentially by one implementation owner:

- **Client layer:** Expo Android Creator app and React reviewer/admin web app.
- **Trusted Platform layer:** Fastify API, Supabase database/storage, OAuth server flow, AI processing, scoring, and Payout ledger.

If either layer's implementation disagrees with this document, this document wins until the contract is deliberately revised. Do not silently rename a field, add a status, change a payload shape, or reproduce Trusted Platform calculations in the Client layer.

## Active local demo profile

The current integration target is deliberately smaller than the durable architecture described later in this document:

- Expo calls the local Express API with demo Creator tokens.
- `POST /v1/submissions` uploads one real MP4 plus optional picker-reported `durationSeconds` as multipart form data and returns a queued Submission.
- Mobile polls the canonical Submission statuses while Express runs direct ElevenLabs transcription and structured Deliverable verification in-process. Phrase and maximum-duration checks are deterministic; relevance requires a structured response from `gemini-2.5-flash` with no alternate model or heuristic fallback.
- Up to four MP4s placed directly in `backend/demo-videos/` are treated as manually curated, pre-approved fixtures and automatically join only the Uniqlo Men's Outfit Haul Bounty when human review starts; no Bounty ID or admin upload call is required.
- After `AI_PASSED`, Creator-scoped demo endpoints open/restore/close an in-memory Review Round and return a public `/review/:token` URL.
- The same Express process serves local video playback, the vertical reviewer page, anonymous Ratings, and the frozen Scoreboard.

This profile is the binding contract for the working-demo gate. Private Storage, signed TUS, persistent jobs, verified webhooks, Meta OAuth, and separate deployed web/admin clients are future profiles and must not block or be falsely advertised by the current demo.

## 1. Source-of-truth files

When implementation starts, create these shared files:

```text
packages/contracts/
  src/
    enums.ts              Canonical string enums
    models.ts             Shared response models
    requests.ts           Request body/query schemas
    responses.ts          Success and error schemas
    endpoints.ts          API path constants
    status-labels.ts      Client display labels for backend states
    index.ts
packages/demo-data/
  src/
    bounties.ts           Stable bounty fixtures and UUIDs
    niches.ts             Stable niche slugs and labels
    creators.ts           Demo-only creator fixtures
```

Layer rules:

1. The Trusted Platform layer implements and validates server behavior against `packages/contracts`.
2. The Client layer imports the same package into mobile and web; do not manually copy interfaces.
3. Contract changes are completed first, before either layer relies on them.
4. `packages/contracts` must not import React, Expo, Fastify, Supabase, or provider SDKs.
5. `packages/contracts` contains public wire contracts only. Database-only fields and provider payloads stay in the Trusted Platform layer.
6. `packages/demo-data` owns stable fixture IDs. Neither layer invents a second ID for the same fixture.

## 2. Canonical terminology

Use the exact terms below in code, API paths, database concepts, UI discussions, commits, and documentation.

| Canonical term | Exact meaning | Do not substitute |
|---|---|---|
| **Creator** | A person using the Android app to enter bounties | user, influencer user, contestant |
| **Creator Profile** | Instagram-derived metrics and Clapback eligibility attached to a Creator | influencer profile, social profile |
| **Bounty** | One fixed brand opportunity displayed as a swipe card | campaign, job, gig, card |
| **Bounty Type** | Either `UGC` or `INFLUENCER` | mode, category, track |
| **Niche** | A creator interest and bounty filter such as Beauty or Gaming | vertical, category, tag |
| **Acceptance** | The record created when a Creator accepts a Bounty | application, match, task |
| **Submission** | One uploaded creator video and its processing state | upload, entry, content item |
| **Deliverable** | One machine-checkable requirement attached to a Bounty | requirement, rule, criterion |
| **Deliverable Check** | The backend result for one Deliverable against one Submission | AI result, validation |
| **Review Round** | The tokenized set of at most five AI-passed Submissions shown to reviewers | deadline, contest, room, queue |
| **Reviewer Session** | One anonymous browser's identity inside a Review Round | reviewer account, audience user |
| **Rating** | One 1–5 score from one Reviewer Session for one Submission | vote, like, score entry |
| **Scoreboard Entry** | One frozen rank generated when a Review Round closes | leaderboard row, result |
| **Payout** | A simulated backend ledger record | payment transaction, transfer |
| **ClapScore** | Creator payout multiplier derived by the backend from follower count | social score, reach score |
| **Trust Score** | Separate creator reliability value; initialized but not central to the demo | ClapScore |
| **Demo Admin** | The developer/operator using the web admin page | brand, superuser |

UI copy may use friendlier phrases, but models and APIs use the canonical names. Example: the UI button may say **End deadline**, while the API operation is **close Review Round**.

## 3. Naming and serialization rules

1. TypeScript uses `camelCase`.
2. API JSON uses `camelCase`.
3. PostgreSQL columns use `snake_case` and are mapped by the Trusted Platform layer before returning JSON.
4. API enum values use uppercase `SCREAMING_SNAKE_CASE` exactly as listed below.
5. IDs are UUID strings unless a field explicitly says otherwise.
6. Monetary amounts are integer cents and end in `Cents`; never send floating-point currency.
7. ClapScore is a numeric multiplier such as `1`, `1.5`, or `2`; clients display it as `1.0x`, `1.5x`, or `2.0x`.
8. Ratings are integers from 1 through 5.
9. Confidence values are numbers from 0 through 1.
10. API timestamps are UTC ISO-8601 strings, for example `2026-08-30T15:04:05.000Z`.
11. Nullable values are returned as `null`, not omitted, when the field is part of a response model.
12. Optional request fields may be omitted.
13. Booleans use positive names: `influencerEligible`, `allNiches`, `required`.
14. Lists return `[]`, never `null`.
15. API base path is `/v1`.
16. Every mutation accepts an `Idempotency-Key` header where the endpoint table marks it required.

## 4. Canonical enums

These values must be defined once in `packages/contracts/src/enums.ts` and imported everywhere.

```ts
export const UserRole = {
  CREATOR: 'CREATOR',
  DEMO_ADMIN: 'DEMO_ADMIN',
} as const;

export const BountyType = {
  UGC: 'UGC',
  INFLUENCER: 'INFLUENCER',
} as const;

export const BountyStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export const AcceptanceStatus = {
  ACTIVE: 'ACTIVE',
  SUBMITTED: 'SUBMITTED',
  CANCELLED: 'CANCELLED',
} as const;

export const SubmissionStatus = {
  CREATED: 'CREATED',
  UPLOADING: 'UPLOADING',
  UPLOADED: 'UPLOADED',
  QUEUED: 'QUEUED',
  TRANSCRIBING: 'TRANSCRIBING',
  EVALUATING: 'EVALUATING',
  AI_PASSED: 'AI_PASSED',
  AI_FAILED: 'AI_FAILED',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  IN_REVIEW: 'IN_REVIEW',
  SCORED: 'SCORED',
} as const;

export const DeliverableKind = {
  SPOKEN_PHRASE: 'SPOKEN_PHRASE',
  RELEVANCE: 'RELEVANCE',
  MAX_DURATION: 'MAX_DURATION',
} as const;

export const MatchMode = {
  ALL_KEYWORDS: 'ALL_KEYWORDS',
  ANY_KEYWORD: 'ANY_KEYWORD',
  LLM_RELEVANCE: 'LLM_RELEVANCE',
} as const;

export const ReviewRoundStatus = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export const PayoutKind = {
  UGC_BUYOUT: 'UGC_BUYOUT',
  INFLUENCER_REWARD: 'INFLUENCER_REWARD',
} as const;

export const PayoutStatus = {
  SIMULATED_PAID: 'SIMULATED_PAID',
} as const;
```

Do not add client-only statuses such as `LOADING`, `SUCCESS`, or `REJECTED` to these backend enums. Client request state stays local to the relevant frontend.

## 5. Canonical public models

The exact Zod implementation can be added during scaffolding, but it must represent these shapes.

```ts
export type Niche = {
  id: number;
  slug: string;
  label: string;
};

export type CreatorProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  instagramUsername: string;
  instagramAccountType: 'BUSINESS' | 'MEDIA_CREATOR';
  followersCount: number;
  followsCount: number | null;
  mediaCount: number | null;
  clapScore: number;
  trustScore: number;
  influencerEligible: boolean;
  allNiches: boolean;
  niches: Niche[];
  metricsFetchedAt: string;
};

export type Deliverable = {
  id: string;
  label: string;
  required: boolean;
} & (
  | {
      kind: 'SPOKEN_PHRASE';
      keywords: string[];
      matchMode: 'ALL_KEYWORDS' | 'ANY_KEYWORD';
    }
  | {
      kind: 'RELEVANCE';
      keywords: string[];
      matchMode: 'LLM_RELEVANCE';
    }
  | {
      kind: 'MAX_DURATION';
      maxDurationSeconds: number;
    }
);

export type Bounty = {
  id: string;
  brandName: string;
  brandLogoUrl: string;
  productName: string;
  productImageUrl: string;
  type: 'UGC' | 'INFLUENCER';
  brief: string;
  deliverables: Deliverable[];
  niches: Niche[];
  basePayoutCents: number;
  creatorPayoutCents: number;
  creatorClapScore: number;
  status: 'OPEN' | 'CLOSED';
  displayDeadline: string;
  creatorEligible: boolean;
  ineligibilityReason: string | null;
};

export type Acceptance = {
  id: string;
  bountyId: string;
  creatorId: string;
  status: 'ACTIVE' | 'SUBMITTED' | 'CANCELLED';
  acceptedAt: string;
  latestSubmission: SubmissionSummary | null;
};

export type DeliverableCheck = {
  deliverableId: string;
  label: string;
  passed: boolean;
  evidence: string;
  confidence: number;
};

export type SubmissionSummary = {
  id: string;
  bountyId: string;
  creatorId: string;
  acceptanceId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  status: keyof typeof SubmissionStatus;
  failureCode: string | null;
  failureMessage: string | null;
  aiSummary: string | null;
  aiConfidence: number | null;
  deliverableChecks: DeliverableCheck[];
  createdAt: string;
  submittedAt: string | null;
};

export type ReviewFeedItem = {
  submissionId: string;
  bountyId: string;
  creatorDisplayName: string;
  creatorAvatarUrl: string | null;
  brandName: string;
  productName: string;
  brief: string;
  playbackUrl: string;
  playbackUrlExpiresAt: string;
  currentRating: number | null;
};

export type ReviewFeed = {
  reviewRoundId: string;
  status: 'OPEN' | 'CLOSED';
  items: ReviewFeedItem[];
  ratedCount: number;
  totalCount: number;
};

export type ScoreboardEntry = {
  submissionId: string;
  rank: number;
  creatorDisplayName: string;
  creatorAvatarUrl: string | null;
  averageScore: number;
  ratingCount: number;
  payoutAmountCents: number;
  payoutStatus: 'SIMULATED_PAID' | null;
};

export type Payout = {
  id: string;
  bountyId: string;
  submissionId: string;
  creatorId: string;
  payoutKind: 'UGC_BUYOUT' | 'INFLUENCER_REWARD';
  amountCents: number;
  status: 'SIMULATED_PAID';
  createdAt: string;
};
```

`transcript`, provider IDs, storage paths, raw Instagram IDs, token values, and internal job data are not included in public frontend models unless a deliberate contract revision adds them.

## 6. Standard response envelope

Every successful API response uses:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_..."
  }
}
```

For list endpoints, `data` is an array and the same `meta.requestId` field is present.

Every error uses:

```json
{
  "error": {
    "code": "BOUNTY_NOT_OPEN",
    "message": "This bounty is no longer accepting submissions.",
    "details": null,
    "requestId": "req_..."
  }
}
```

Rules:

1. Frontends branch on `error.code`, not text matching `message`.
2. `message` is safe to show to a user unless the frontend has a friendlier mapping.
3. Validation details may be an object or `null`.
4. Provider errors are converted into Clapback errors; provider response bodies never leak to clients.
5. Unexpected errors use `INTERNAL_ERROR` and retain the request ID for admin diagnosis.

## 7. Stable public error codes

At minimum, both sides support these codes:

| Code | Expected frontend behavior |
|---|---|
| `AUTH_REQUIRED` | Clear invalid access state and route to login |
| `AUTH_EXPIRED` | Attempt refresh once, then route to login |
| `FORBIDDEN` | Show access-denied state |
| `META_LOGIN_CANCELLED` | Return to welcome screen without an alarming error |
| `META_ACCOUNT_UNSUPPORTED` | Explain professional-account requirement; offer demo creator |
| `META_METRICS_UNAVAILABLE` | Explain missing metrics; offer retry/demo creator |
| `BOUNTY_NOT_FOUND` | Remove stale card and refresh |
| `BOUNTY_NOT_OPEN` | Show closed state and refresh cards |
| `CREATOR_NOT_ELIGIBLE` | Show `ineligibilityReason` and do not retry |
| `ACCEPTANCE_ALREADY_EXISTS` | Treat returned existing Acceptance as success |
| `INVALID_VIDEO_TYPE` | Ask creator to choose an MP4 |
| `VIDEO_TOO_LARGE` | Display configured size limit |
| `UPLOAD_NOT_FOUND` | Offer upload retry |
| `INVALID_SUBMISSION_STATE` | Refresh Submission; do not force a client transition |
| `PROCESSING_RETRY_NOT_ALLOWED` | Refresh Submission and hide retry action |
| `REVIEW_ROUND_NOT_FOUND` | Show invalid QR page |
| `REVIEW_ROUND_NOT_OPEN` | Show closed/waiting page and fetch scoreboard if available |
| `SUBMISSION_NOT_IN_ROUND` | Remove stale feed item and refresh |
| `RATING_OUT_OF_RANGE` | Restore prior rating and show validation message |
| `PAYOUT_ALREADY_EXISTS` | Treat returned existing Payout as success |
| `DEMO_MODE_DISABLED` | Hide demo-only action |
| `RATE_LIMITED` | Disable action briefly and offer retry |
| `INTERNAL_ERROR` | Show retry plus request ID on admin pages |

## 8. Endpoint contract and layer responsibilities

The Trusted Platform layer implements and validates endpoints. The Client layer consumes them and implements UI states.

| Method and path | Auth | Request | Response `data` | Idempotency |
|---|---|---|---|---|
| `GET /v1/auth/meta/start` | none | query `appRedirectUri` | HTTP redirect | no |
| `GET /v1/auth/meta/callback` | Meta state | provider query | HTTP redirect to app | internal |
| `POST /v1/auth/exchange` | none | `{ exchangeCode }` | `{ accessToken, refreshToken, creator }` | yes |
| `POST /v1/auth/refresh` | refresh token | `{ refreshToken }` | `{ accessToken, refreshToken }` | yes |
| `POST /v1/demo/auth/login` | demo PIN | `{ pin, creatorFixtureId }` | `{ accessToken, refreshToken, creator }` | yes |
| `GET /v1/me` | Creator | none | `CreatorProfile` | no |
| `PUT /v1/me/niches` | Creator | `{ allNiches, nicheIds }` | `CreatorProfile` | yes |
| `GET /v1/bounties` | Creator | none | `Bounty[]` | no |
| `POST /v1/bounties/:bountyId/accept` | Creator | none | `Acceptance` | yes |
| `GET /v1/acceptances` | Creator | none | `Acceptance[]` | no |
| `POST /v1/submissions` | Creator | local profile: multipart `acceptanceId` + optional `durationSeconds` + `video`; required `Idempotency-Key` header | `{ submission }` | yes |
| `POST /v1/submissions/:submissionId/upload-complete` | Creator | reserved for durable TUS; unsupported locally | canonical `INVALID_SUBMISSION_STATE` error | no |
| `GET /v1/submissions/:submissionId` | Creator | none | `SubmissionSummary` | no |
| `POST /v1/submissions/:submissionId/retry` | Creator | local profile directs replacement media to `POST /v1/submissions` | canonical retry/instruction error | no |
| `POST /v1/review/:token/session` | public token | `{ anonymousToken }` | `{ reviewerSessionId }` | yes |
| `GET /v1/review/:token/feed` | review session | none | `ReviewFeed` | no |
| `PUT /v1/review/:token/ratings/:submissionId` | review session | `{ score }` | `{ submissionId, score, ratedCount, totalCount }` | yes |
| `GET /v1/review/:token/progress` | review session | none | `{ ratedCount, totalCount }` | no |
| `GET /v1/review/:token/scoreboard` | public token | none | `{ status, entries }` | no |
| `POST /v1/admin/auth/login` | demo PIN | `{ pin }` | `{ accessToken }` | yes |
| `GET /v1/admin/bounties/:bountyId/results` | Demo Admin | none | admin results model | no |
| `POST /v1/admin/demo/submissions` | Demo Admin | fixture/form metadata | `{ submission, upload }` | yes |
| `POST /v1/admin/submissions/:submissionId/reprocess` | Demo Admin | none | `SubmissionSummary` | yes |
| `POST /v1/admin/review-rounds` | Demo Admin | `{ bountyId, submissionIds }` | review round model | yes |
| `POST /v1/admin/review-rounds/:reviewRoundId/open` | Demo Admin | none | `{ reviewRound, reviewUrl }` | yes |
| `POST /v1/admin/review-rounds/:reviewRoundId/close` | Demo Admin | none | `{ reviewRound, scoreboard }` | yes |
| `POST /v1/admin/payouts/ugc` | Demo Admin | `{ bountyId, submissionId }` | `Payout` | yes |
| `POST /v1/admin/payouts/influencers` | Demo Admin | `{ bountyId, submissionIds }` | `Payout[]` | yes |
| `POST /v1/admin/demo/reset` | Demo Admin | `{ confirmation }` | `{ reset: true }` | yes |

Provider webhook routes are backend-only and are not imported into frontend endpoint helpers.

## 9. Upload contracts

### 9.1 Active local prototype profile

The current Express prototype supports one explicit local-only upload path:

1. The Client sends `multipart/form-data` to `POST /v1/submissions` with text field `acceptanceId`, optional finite nonnegative text field `durationSeconds`, file field `video`, and a required `Idempotency-Key` header. Picker-reported duration is trusted only for this controlled local demo; a required `MAX_DURATION` Deliverable fails when duration is absent and uses strict `durationSeconds < maxDurationSeconds` semantics.
2. The Trusted Platform derives Creator and Bounty from the owned active Acceptance; it never trusts a client-supplied Creator or Bounty ID.
3. A replay with the same Creator/idempotency key returns the original Submission and discards the duplicate local file.
4. A different key is rejected while that Acceptance already has a non-failed Submission. A replacement is allowed only after `AI_FAILED` or `PROCESSING_ERROR`.
5. Success returns `{ submission: SubmissionSummary }`. The local profile does not return an `UploadDescriptor`, does not claim TUS support, and does not use `upload-complete`.
6. This profile exists only to validate the local contract/security/media gate. It is not the mobile production transport.

### 9.2 Target durable signed-TUS profile — not implemented

The private Storage gate will deliberately revise `POST /v1/submissions` and retry behavior to return this upload descriptor:

```ts
export type UploadDescriptor = {
  protocol: 'TUS';
  endpoint: string;
  headers: Record<string, string>;
  storagePath: string;
  expiresAt: string;
  maxSizeBytes: number;
};
```

Target durable rules:

1. The Client layer does not construct a Supabase path.
2. The Client layer sends exactly the returned headers to the returned endpoint.
3. The Client layer reports progress from the TUS client.
4. The Client layer calls `upload-complete` only after TUS success.
5. The Trusted Platform layer verifies the stored object before changing the Submission to `QUEUED`.
6. A new retry receives a new Submission ID and storage path.
7. Signed credentials and storage paths must not be persisted in analytics or logs.
8. Gate D cannot close until this target replaces the local profile in shared schemas, runtime behavior, and real Android validation.

## 10. Authentication boundary contract

### Mobile Meta flow

1. Mobile creates its callback URI as `clapback://oauth/callback`.
2. Mobile opens `GET /v1/auth/meta/start?appRedirectUri=<encoded callback>`.
3. Backend validates the allowlisted callback, creates OAuth state, and redirects to Meta.
4. Meta redirects to backend `/v1/auth/meta/callback`.
5. Backend exchanges the provider code, fetches profile metrics, and creates a one-use `exchangeCode`.
6. Backend redirects to `clapback://oauth/callback?exchangeCode=...`.
7. Mobile sends the code to `POST /v1/auth/exchange`.
8. Backend returns Clapback app tokens and `CreatorProfile`.
9. Mobile stores app tokens in secure storage. Mobile never receives the Meta client secret or provider access token.

### Token behavior

1. Creator access token goes in `Authorization: Bearer <token>`.
2. On `AUTH_EXPIRED`, the API client performs one refresh attempt and retries the original request once.
3. Concurrent expired requests share one refresh promise to avoid rotating the same refresh token multiple times.
4. Failed refresh clears secure storage and routes to login.
5. Admin and Creator tokens are not interchangeable.

## 11. Submission state contract

Only the Trusted Platform layer transitions `SubmissionStatus`. The Client layer renders it.

```text
CREATED -> UPLOADING -> UPLOADED -> QUEUED
QUEUED -> TRANSCRIBING -> EVALUATING
EVALUATING -> AI_PASSED -> IN_REVIEW -> SCORED
EVALUATING -> AI_FAILED
TRANSCRIBING/EVALUATING -> PROCESSING_ERROR
```

Frontend status labels are fixed:

| Backend status | Creator app label | Admin label |
|---|---|---|
| `CREATED` | Preparing upload | Created |
| `UPLOADING` | Uploading video | Uploading |
| `UPLOADED` | Upload received | Uploaded |
| `QUEUED` | Waiting for checks | Queued |
| `TRANSCRIBING` | Checking audio | Transcribing |
| `EVALUATING` | Checking deliverables | AI evaluating |
| `AI_PASSED` | Sent to reviewers | AI passed |
| `AI_FAILED` | Needs another attempt | AI failed |
| `PROCESSING_ERROR` | Processing problem | Processing error |
| `IN_REVIEW` | With reviewers | In review |
| `SCORED` | Results ready | Scored |

Media processing rules:

1. Frontend uploads the accepted original MP4 unchanged to the authorized private Storage target.
2. Frontend never extracts audio, transcodes video, installs FFmpeg, or creates a derivative MP3.
3. Backend creates a short-lived signed read URL for the original private MP4 and sends it to ElevenLabs as `source_url` with asynchronous webhook processing and Submission correlation metadata.
4. `TRANSCRIBING` / **Checking audio** means speech-to-text analysis of the uploaded video; it does not imply a separate audio file.
5. FFmpeg is outside the base contract. It may be proposed only as a documented compatibility fallback after representative uploads demonstrate an unsupported codec/container, and any such change follows the contract-change protocol.

ElevenLabs documents direct video/file input, `source_url`, asynchronous webhooks, and webhook metadata in the [Speech-to-Text convert API](https://elevenlabs.io/docs/api-reference/speech-to-text/convert). Content from the linked documentation has been rephrased for compliance with licensing restrictions.

Submission state rules:

1. Frontend must not infer `AI_PASSED` from a non-null transcript or confidence.
2. Frontend must not show a retry action for `AI_PASSED`, `IN_REVIEW`, or `SCORED`.
3. `AI_FAILED` permits the creator to create a replacement Submission.
4. `PROCESSING_ERROR` permits admin reprocessing; creator behavior comes from the response's available actions if added later.
5. Failure text comes from `failureMessage`; clients do not expose internal `failureCode` unless mapped.

## 12. Review and scoreboard contract

1. A Review Round contains one Bounty and at most five distinct `AI_PASSED` Submissions.
2. Opening a round changes selected Submissions to `IN_REVIEW`.
3. One Reviewer Session may have one Rating per Submission; `PUT` updates that value.
4. Rating controls are disabled when round status is `CLOSED`.
5. Closing a round is a backend transaction. Frontend does not calculate or submit ranking.
6. `finalScore` is not sent by clients. Backend calculates `averageScore`.
7. Ranking is average descending, rating count descending, submitted-at ascending, Submission ID ascending.
8. Scoreboard is read from frozen `scoreboard_entries`, not recomputed in the browser.
9. Reviewer web fetches the scoreboard after receiving `REVIEW_ROUND_NOT_OPEN` or observing `CLOSED`.
10. Playback URLs are temporary. A failed/expired playback request triggers a feed refresh, not a public bucket fallback.

## 13. Payout contract

1. All payouts are simulated and must display **Demo payout** or **Simulated paid**.
2. UGC accepts exactly one Submission ID and creates `UGC_BUYOUT`.
3. Influencer accepts one or more Submission IDs and creates one `INFLUENCER_REWARD` per Submission.
4. Backend calculates all payout amounts. Frontend displays returned `amountCents`.
5. Frontend may preview `creatorPayoutCents` from a Bounty but must not use that preview to create a payout amount.
6. Backend enforces idempotency; `PAYOUT_ALREADY_EXISTS` returns the existing record and is treated as success.
7. No bank, card, Stripe account, or legal rights-transfer model appears in the base contract.

## 14. Fixture contract

1. Stable Bounty and Creator fixture UUIDs live only in `packages/demo-data`.
2. Database seed logic imports or mirrors those exact IDs.
3. Frontends receive fixtures through API responses; they do not maintain a second copy of card data.
4. Local frontend mocks import the fixture package and wrap data in actual response schemas.
5. Fixture changes must preserve an existing ID if it is the same logical Bounty.
6. At least one fixture is `UGC`, one is `INFLUENCER`, one prepared video passes, and one prepared video fails.
7. Niche slugs are stable lowercase values: `beauty`, `fashion`, `food`, `fitness`, `gaming`, `technology`, `lifestyle`.
8. `All niches` is not a Niche record; it is `CreatorProfile.allNiches = true`.

## 15. Client/Trusted Platform responsibility boundary

| Concern | Client layer | Trusted Platform layer |
|---|---|---|
| Expo screens and navigation | implements | does not edit |
| React reviewer/admin pages | implements | does not edit |
| Loading/error/empty UI | implements | supplies stable errors |
| Secure local app token storage | implements | defines token behavior |
| API client and query cache | implements | supplies endpoints/contracts |
| Swipe gesture and video playback | implements | supplies Bounty/feed data |
| TUS client and progress UI | implements | signs and verifies upload |
| Database schema and migrations | does not edit | implements |
| Supabase bucket and policies | does not edit | implements |
| Workflow transitions | renders only | enforces |
| Meta secret/code exchange | opens flow only | implements |
| ClapScore and eligibility | displays only | calculates authoritatively |
| STT/LLM processing | displays status only | implements |
| Review candidate validation | displays result only | validates authoritatively |
| Rating persistence | sends score | validates and upserts |
| Scoreboard calculation | displays only | calculates authoritatively |
| Payout calculation/ledger | displays and triggers | calculates and persists |
| Shared contract | imports and validates consumption | implements and validates production |
| Fixture visual assets and IDs | uses visual assets | supplies stable IDs/data seed |

## 16. Sequential gate inputs and outputs

One implementation owner advances through these gates in order. A later gate starts only after its required inputs are complete and validated.

### Trusted Platform outputs consumed by Client gates

1. Built `packages/contracts` artifacts.
2. Base API URL and allowed mobile/web origins.
3. Fixture IDs and seeded demo credentials supplied through a secure channel.
4. A populated local/demo environment or mock JSON conforming to schemas.
5. Endpoint readiness checklist.
6. Known error codes for each endpoint.
7. OAuth callback and deep-link configuration values.
8. Upload size/type rules.

### Client outputs consumed by Trusted Platform gates

1. Exact mobile deep-link URI.
2. Web deployment origin for CORS.
3. Anonymous Reviewer Session token transport choice: cookie or explicit header.
4. TUS client proof against a signed upload descriptor.
5. UI screenshots/state list showing every consumed backend status.
6. Request IDs from observed backend failures.

### Gate advancement rules

- Contract-validated mocks may support Client work before the matching endpoints exist, but each real endpoint must pass the same schemas before its consumption gate closes.
- Endpoint behavior and all consumers use the same Zod schemas.
- Every gate uses fixture IDs from `packages/demo-data`.
- Enum or endpoint shape changes update the contract before implementation or consumption proceeds.
- Validation evidence from the current gate becomes the input record for the next gate.

## 17. Sequential integration gates

These gates are completed in order and are not schedule estimates.

### Gate A — Contract compiles

- Mobile and web import shared enums/models.
- The Trusted Platform API imports request/response schemas.
- Fixture IDs are shared.
- One example success and one example error parse in all consumers.

### Gate B — Authentication boundary

- Android opens the Trusted Platform Meta start URL.
- The Trusted Platform returns through `clapback://oauth/callback`.
- Mobile exchanges code and calls `/v1/me`.
- Refresh rotation succeeds once and concurrent calls do not race.

### Gate C — Bounty and Acceptance

- Mobile renders the real `/v1/bounties` response.
- Right swipe creates an Acceptance once.
- Existing Acceptance behaves idempotently.
- Eligibility and Payout displayed by mobile match the Trusted Platform response exactly.

### Gate D — Upload and processing

- Mobile and admin web consume the same `UploadDescriptor`.
- TUS upload completes.
- `upload-complete` queues processing.
- Status progression renders without Client-created states.
- One valid and one invalid video reach expected terminal states.

### Gate E — Review

- Admin opens a round with five Trusted Platform-approved Submission IDs.
- QR URL works on a separate device.
- Reviewer Ratings persist and update.
- Closed round disables writes.

### Gate F — Scoreboard and Payout

- The Trusted Platform closes and freezes ranking.
- Reviewer and admin pages render the same entries.
- One UGC Payout and multiple Influencer Payouts are idempotent.

## 18. Contract-change protocol

When the implementation needs a contract change:

1. Describe the user-facing reason.
2. Edit `packages/contracts` and this document first.
3. Mark the change as additive or breaking.
4. Update shared fixtures and contract-validated mocks.
5. Update the Trusted Platform implementation and validate produced responses.
6. Update Client consumption and validate parsed responses.
7. Run schema parsing and type checks in all three applications.
8. Remove temporary compatibility fields only after both layers use the revised contract.
9. Record the completed validation as the input for the next sequential gate.

Forbidden shortcuts:

- `any` around an API response;
- duplicate handwritten Client response interfaces;
- Client-side conversion of a new undocumented status;
- returning database rows directly from API handlers;
- adding fields that mean the same thing under different names;
- calculating ClapScore, final ranking, or Payout independently in the Client layer;
- using brand, campaign, entry, vote, or leaderboard as model names where the canonical terms apply.

## 19. Definition of gate-ready

A feature may advance to its next sequential gate only when:

1. Its request and response parse through shared schemas.
2. All referenced enum values are canonical.
3. Success, empty, loading, and documented error states have behavior.
4. IDs originate from the Trusted Platform/shared fixtures.
5. Money and timestamps follow serialization rules.
6. Mutations are protected from duplicate taps through Client disabling and Trusted Platform idempotency.
7. Logs contain a request ID but no secret.
8. The next gate can validate the feature through public contracts without reading internal implementation code.
