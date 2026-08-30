import { z } from 'zod';

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

const nullableUrlSchema = z.string().nullable();

export const nicheSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  label: z.string().min(1),
});

export const creatorProfileSchema = z.object({
  userId: z.uuid(),
  displayName: z.string().min(1),
  avatarUrl: nullableUrlSchema,
  instagramUsername: z.string().min(1),
  instagramAccountType: z.enum(['BUSINESS', 'MEDIA_CREATOR']),
  followersCount: z.number().int().nonnegative(),
  followsCount: z.number().int().nonnegative().nullable(),
  mediaCount: z.number().int().nonnegative().nullable(),
  clapScore: z.number().positive(),
  trustScore: z.number().int().nonnegative(),
  influencerEligible: z.boolean(),
  allNiches: z.boolean(),
  niches: z.array(nicheSchema),
  metricsFetchedAt: z.iso.datetime(),
});

export const deliverableSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['SPOKEN_PHRASE', 'RELEVANCE']),
  required: z.boolean(),
  keywords: z.array(z.string()),
  matchMode: z.enum(['ALL_KEYWORDS', 'ANY_KEYWORD', 'LLM_RELEVANCE']),
});

export const bountySchema = z.object({
  id: z.uuid(),
  brandName: z.string().min(1),
  brandLogoUrl: z.string(),
  productName: z.string().min(1),
  productImageUrl: z.string(),
  type: z.enum(['UGC', 'INFLUENCER']),
  brief: z.string().min(1),
  deliverables: z.array(deliverableSchema).min(1),
  niches: z.array(nicheSchema).min(1),
  basePayoutCents: z.number().int().nonnegative(),
  creatorPayoutCents: z.number().int().nonnegative(),
  creatorClapScore: z.number().positive(),
  status: z.enum(['OPEN', 'CLOSED']),
  displayDeadline: z.string().min(1),
  creatorEligible: z.boolean(),
  ineligibilityReason: z.string().nullable(),
});

export const deliverableCheckSchema = z.object({
  deliverableId: z.string(),
  label: z.string(),
  passed: z.boolean(),
  evidence: z.string(),
  confidence: z.number().min(0).max(1),
});

export const submissionSummarySchema = z.object({
  id: z.uuid(),
  bountyId: z.uuid(),
  creatorId: z.uuid(),
  acceptanceId: z.uuid(),
  originalFilename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  durationSeconds: z.number().nonnegative().nullable(),
  status: z.enum(Object.values(SubmissionStatus)),
  failureCode: z.string().nullable(),
  failureMessage: z.string().nullable(),
  aiSummary: z.string().nullable(),
  aiConfidence: z.number().min(0).max(1).nullable(),
  deliverableChecks: z.array(deliverableCheckSchema),
  createdAt: z.iso.datetime(),
  submittedAt: z.iso.datetime().nullable(),
});

export const acceptanceSchema = z.object({
  id: z.uuid(),
  bountyId: z.uuid(),
  creatorId: z.uuid(),
  status: z.enum(['ACTIVE', 'SUBMITTED', 'CANCELLED']),
  acceptedAt: z.iso.datetime(),
  latestSubmission: submissionSummarySchema.nullable(),
});

export const uploadDescriptorSchema = z.object({
  protocol: z.literal('TUS'),
  endpoint: z.url(),
  headers: z.record(z.string(), z.string()),
  storagePath: z.string(),
  expiresAt: z.iso.datetime(),
  maxSizeBytes: z.number().int().positive(),
});

export const apiMetaSchema = z.object({
  requestId: z.string().min(1),
});

export const successEnvelopeSchema = <Schema extends z.ZodType>(schema: Schema) => z.object({
  data: schema,
  meta: apiMetaSchema,
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().nullable(),
    requestId: z.string(),
  }),
});

export const demoCreatorLoginRequestSchema = z.object({
  pin: z.string().min(1),
  creatorFixtureId: z.uuid(),
});

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const demoCreatorLoginResultSchema = tokenPairSchema.extend({
  creator: creatorProfileSchema,
});
export const demoCreatorLoginResponseSchema = successEnvelopeSchema(demoCreatorLoginResultSchema);

export const tokenRefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export const tokenRefreshResultSchema = tokenPairSchema;
export const tokenRefreshResponseSchema = successEnvelopeSchema(tokenRefreshResultSchema);

export const adminLoginRequestSchema = z.object({
  pin: z.string().min(1),
});
export const adminLoginResultSchema = z.object({
  accessToken: z.string().min(1),
});
export const adminLoginResponseSchema = successEnvelopeSchema(adminLoginResultSchema);

export const idempotencyKeySchema = z.string().trim().min(1).max(200);

export const localSubmissionCreateFieldsSchema = z.object({
  acceptanceId: z.uuid(),
});
export const submissionCreateRequestSchema = localSubmissionCreateFieldsSchema;
export const submissionCreateResultSchema = z.object({
  submission: submissionSummarySchema,
});
export const submissionCreateResponseSchema = successEnvelopeSchema(submissionCreateResultSchema);

export type Niche = z.infer<typeof nicheSchema>;
export type CreatorProfile = z.infer<typeof creatorProfileSchema>;
export type Deliverable = z.infer<typeof deliverableSchema>;
export type Bounty = z.infer<typeof bountySchema>;
export type DeliverableCheck = z.infer<typeof deliverableCheckSchema>;
export type SubmissionSummary = z.infer<typeof submissionSummarySchema>;
export type Acceptance = z.infer<typeof acceptanceSchema>;
export type UploadDescriptor = z.infer<typeof uploadDescriptorSchema>;
export type ApiMeta = z.infer<typeof apiMetaSchema>;
export type DemoCreatorLoginRequest = z.infer<typeof demoCreatorLoginRequestSchema>;
export type DemoCreatorLoginResult = z.infer<typeof demoCreatorLoginResultSchema>;
export type TokenRefreshRequest = z.infer<typeof tokenRefreshRequestSchema>;
export type TokenRefreshResult = z.infer<typeof tokenRefreshResultSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginRequestSchema>;
export type AdminLoginResult = z.infer<typeof adminLoginResultSchema>;
export type SubmissionCreateRequest = z.infer<typeof submissionCreateRequestSchema>;
export type SubmissionCreateResult = z.infer<typeof submissionCreateResultSchema>;
export type SubmissionStatusValue = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export type SuccessEnvelope<T> = { data: T; meta: ApiMeta };
export type ApiErrorEnvelope = z.infer<typeof apiErrorSchema>;

export const creatorSubmissionLabels: Record<SubmissionStatusValue, string> = {
  CREATED: 'Preparing upload',
  UPLOADING: 'Uploading video',
  UPLOADED: 'Upload received',
  QUEUED: 'Waiting for checks',
  TRANSCRIBING: 'Checking audio',
  EVALUATING: 'Checking deliverables',
  AI_PASSED: 'Sent to reviewers',
  AI_FAILED: 'Needs another attempt',
  PROCESSING_ERROR: 'Processing problem',
  IN_REVIEW: 'With reviewers',
  SCORED: 'Results ready',
};
