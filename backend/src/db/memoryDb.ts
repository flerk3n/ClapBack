import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export type BountyType = 'UGC' | 'INFLUENCER';
export type BountyStatus = 'OPEN' | 'CLOSED';
export type AcceptanceStatus = 'ACTIVE' | 'SUBMITTED' | 'CANCELLED';
export type SubmissionStatus =
  | 'CREATED' | 'UPLOADING' | 'UPLOADED' | 'QUEUED'
  | 'TRANSCRIBING' | 'EVALUATING' | 'AI_PASSED' | 'AI_FAILED'
  | 'PROCESSING_ERROR' | 'IN_REVIEW' | 'SCORED';
export type ReviewRoundStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type PayoutKind = 'UGC_BUYOUT' | 'INFLUENCER_REWARD';
export type UserRole = 'CREATOR' | 'DEMO_ADMIN';

export const DEMO_CREATOR_FIXTURE_ID = 'ebf4b0b2-d96f-47d2-8f27-60139947f6b8';
export const UNIQLO_MENS_OUTFIT_HAUL_BOUNTY_ID = 'e332e380-c016-4c42-8b3f-a8e393a6ae93';

export interface Niche { id: number; slug: string; label: string }
type TranscriptDeliverable = {
  id: string;
  label: string;
  required: boolean;
  keywords: string[];
} & (
  | { kind: 'SPOKEN_PHRASE'; matchMode: 'ALL_KEYWORDS' | 'ANY_KEYWORD' }
  | { kind: 'RELEVANCE'; matchMode: 'LLM_RELEVANCE' }
);
type DurationDeliverable = {
  id: string;
  label: string;
  kind: 'MAX_DURATION';
  required: boolean;
  maxDurationSeconds: number;
};
export type Deliverable = TranscriptDeliverable | DurationDeliverable;
export interface DeliverableCheck {
  deliverableId: string;
  label: string;
  passed: boolean;
  evidence: string;
  confidence: number;
}
export interface User {
  id: string;
  role: UserRole;
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
  nicheIds: number[];
  metricsFetchedAt: string;
  clapCoinsBalance: number;
  createdAt: string;
}
export interface Bounty {
  id: string;
  brandName: string;
  brandLogoUrl: string;
  productName: string;
  productImageUrl: string;
  type: BountyType;
  brief: string;
  deliverables: Deliverable[];
  nicheIds: number[];
  basePayoutCents: number;
  status: BountyStatus;
  displayDeadline: string;
  deadlineHours: number;
  createdAt: string;
}
export interface Acceptance {
  id: string;
  bountyId: string;
  creatorId: string;
  status: AcceptanceStatus;
  acceptedAt: string;
  deadlineAt: string;
}
export interface Submission {
  id: string;
  bountyId: string;
  creatorId: string;
  acceptanceId: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  isReviewFixture: boolean;
  status: SubmissionStatus;
  failureCode: string | null;
  failureMessage: string | null;
  transcript: string | null;
  aiSummary: string | null;
  aiConfidence: number | null;
  deliverableChecks: DeliverableCheck[];
  createdAt: string;
  submittedAt: string | null;
  updatedAt: string;
}
export interface ReviewRound {
  id: string;
  bountyId: string;
  publicToken: string;
  publicTokenHash: string;
  submissionIds: string[];
  status: ReviewRoundStatus;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}
export interface ReviewerSession { id: string; reviewRoundId: string; anonymousTokenHash: string; createdAt: string }
export interface Rating {
  id: string;
  reviewRoundId: string;
  reviewerSessionId: string;
  submissionId: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}
export interface ScoreboardEntry {
  reviewRoundId: string;
  submissionId: string;
  rank: number;
  averageScore: number;
  ratingCount: number;
  snapshotAt: string;
}
export interface Payout {
  id: string;
  bountyId: string;
  submissionId: string;
  creatorId: string;
  payoutKind: PayoutKind;
  amountCents: number;
  status: 'SIMULATED_PAID';
  idempotencyKey: string;
  createdAt: string;
}
export interface LedgerEntry {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend';
  description: string;
  createdAt: string;
}

export const NICHES: Niche[] = [
  { id: 1, slug: 'beauty', label: 'Beauty' },
  { id: 2, slug: 'fashion', label: 'Fashion' },
  { id: 3, slug: 'food', label: 'Food' },
  { id: 4, slug: 'fitness', label: 'Fitness' },
  { id: 5, slug: 'gaming', label: 'Gaming' },
  { id: 6, slug: 'technology', label: 'Technology' },
  { id: 7, slug: 'lifestyle', label: 'Lifestyle' },
];

const FIXTURE_CREATED_AT = '2026-08-30T07:00:00.000Z';
const BOUNTIES: Bounty[] = [
  {
    id: 'b4fd66c8-8434-4a12-814b-b9c04f835900', brandName: 'GlowPop', brandLogoUrl: 'fixture://glowpop',
    productName: 'Hydra Cloud Serum', productImageUrl: 'fixture://hydra-cloud', type: 'UGC',
    brief: 'Make hydration feel irresistible in a crisp, honest skincare recommendation.',
    deliverables: [
      { id: 'brand', label: 'Say “GlowPop”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['GlowPop'], matchMode: 'ALL_KEYWORDS' },
      { id: 'offer', label: 'Mention “20% off”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['20% off'], matchMode: 'ALL_KEYWORDS' },
      { id: 'code', label: 'Say the code “CLAP20”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['CLAP20'], matchMode: 'ALL_KEYWORDS' },
    ],
    nicheIds: [1, 7], basePayoutCents: 15000, status: 'OPEN', displayDeadline: 'Closes at 8:00 PM', deadlineHours: 24, createdAt: FIXTURE_CREATED_AT,
  },
  {
    id: 'ccfbe460-c852-49f8-a2fd-0032e7553f61', brandName: 'Aster Run', brandLogoUrl: 'fixture://aster-run',
    productName: 'Form 02 Trainer', productImageUrl: 'fixture://form-trainer', type: 'INFLUENCER',
    brief: 'Show the one detail that makes your everyday run feel more considered.',
    deliverables: [
      { id: 'brand', label: 'Mention “Aster Run”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['Aster Run'], matchMode: 'ALL_KEYWORDS' },
      { id: 'comfort', label: 'Talk about all-day comfort', kind: 'RELEVANCE', required: true, keywords: ['comfort'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [4, 2], basePayoutCents: 18000, status: 'OPEN', displayDeadline: '2 days left', deadlineHours: 48, createdAt: FIXTURE_CREATED_AT,
  },
  {
    id: '4cd42158-b24b-493b-b945-87385627a735', brandName: 'Nori House', brandLogoUrl: 'fixture://nori-house',
    productName: 'Tokyo Crunch Kit', productImageUrl: 'fixture://tokyo-crunch', type: 'UGC',
    brief: 'Turn the first bite into a tiny cinematic moment—texture, sound, reaction.',
    deliverables: [
      { id: 'brand', label: 'Say “Nori House”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['Nori House'], matchMode: 'ALL_KEYWORDS' },
      { id: 'reaction', label: 'Include your first-bite reaction', kind: 'RELEVANCE', required: true, keywords: ['first bite'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [3, 7], basePayoutCents: 12000, status: 'OPEN', displayDeadline: 'Closes tomorrow', deadlineHours: 24, createdAt: FIXTURE_CREATED_AT,
  },
  {
    id: '8b0cce8a-761e-40e4-930e-1941a670f920', brandName: 'Softbyte', brandLogoUrl: 'fixture://softbyte',
    productName: 'Pocket Mic Mini', productImageUrl: 'fixture://pocket-mic', type: 'INFLUENCER',
    brief: 'Show how cleaner sound changes an ordinary creator setup.',
    deliverables: [
      { id: 'brand', label: 'Mention “Softbyte”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['Softbyte'], matchMode: 'ALL_KEYWORDS' },
      { id: 'sound', label: 'Compare the before and after sound', kind: 'RELEVANCE', required: true, keywords: ['sound'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [6, 5], basePayoutCents: 20000, status: 'OPEN', displayDeadline: '3 days left', deadlineHours: 72, createdAt: FIXTURE_CREATED_AT,
  },
  {
    id: UNIQLO_MENS_OUTFIT_HAUL_BOUNTY_ID, brandName: 'Uniqlo', brandLogoUrl: 'fixture://uniqlo',
    productName: "Men's Outfit Haul", productImageUrl: 'fixture://uniqlo-mens-outfit-haul', type: 'UGC',
    brief: "Show and describe a men’s T-shirt from your Uniqlo haul in under 1 minute.",
    deliverables: [
      { id: 'mens-tshirt', label: 'Show a men’s T-shirt', kind: 'RELEVANCE', required: true, keywords: ["men’s T-shirt", "men's T-shirt", 'mens T-shirt', 'T-shirt', 'Tshirt', 'tee'], matchMode: 'LLM_RELEVANCE' },
      { id: 'under-1-minute', label: 'Keep the video under 1 minute', kind: 'MAX_DURATION', required: true, maxDurationSeconds: 60 },
    ],
    nicheIds: [2, 7], basePayoutCents: 15000, status: 'OPEN', displayDeadline: '3 days left', deadlineHours: 72, createdAt: FIXTURE_CREATED_AT,
  },
  {
    id: '195509a2-2a00-4ba5-bf4a-383599e5cc64', brandName: 'Still Sunday', brandLogoUrl: 'fixture://still-sunday',
    productName: 'Everyday Carry Tote', productImageUrl: 'fixture://carry-tote', type: 'UGC',
    brief: 'A quiet “what fits in my bag” edit with your real everyday essentials.',
    deliverables: [
      { id: 'brand', label: 'Say “Still Sunday”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['Still Sunday'], matchMode: 'ALL_KEYWORDS' },
      { id: 'items', label: 'Show at least three essentials', kind: 'RELEVANCE', required: true, keywords: ['essentials'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [2, 7], basePayoutCents: 17500, status: 'OPEN', displayDeadline: '4 days left', deadlineHours: 96, createdAt: FIXTURE_CREATED_AT,
  },
];

const users = new Map<string, User>();
const acceptances = new Map<string, Acceptance>();
const submissions = new Map<string, Submission>();
const submissionCreateIdempotency = new Map<string, string>();
const reviewRounds = new Map<string, ReviewRound>();
const reviewerSessions = new Map<string, ReviewerSession>();
const ratings = new Map<string, Rating>();
const scoreboardEntries = new Map<string, ScoreboardEntry[]>();
const payouts = new Map<string, Payout>();
const ledger = new Map<string, LedgerEntry[]>();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createDemoCreator(): User {
  const user: User = {
    id: DEMO_CREATOR_FIXTURE_ID,
    role: 'CREATOR',
    displayName: 'Maya Chen',
    avatarUrl: null,
    instagramUsername: 'mayamakes',
    instagramAccountType: 'MEDIA_CREATOR',
    followersCount: 28600,
    followsCount: 814,
    mediaCount: 242,
    clapScore: 1.5,
    trustScore: 100,
    influencerEligible: true,
    allNiches: false,
    nicheIds: [],
    metricsFetchedAt: '2026-08-30T07:00:00.000Z',
    clapCoinsBalance: 0,
    createdAt: FIXTURE_CREATED_AT,
  };
  users.set(user.id, user);
  return user;
}

export const db = {
  createUser(data: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    users.set(user.id, user);
    return user;
  },
  getUser(id: string): User | undefined { return users.get(id); },
  updateUser(id: string, patch: Partial<User>): User | undefined {
    const user = users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...patch };
    users.set(id, updated);
    return updated;
  },
  findUserByUsername(username: string): User | undefined {
    return Array.from(users.values()).find(user => user.instagramUsername === username);
  },
  getOrCreateDemoUser(): User { return users.get(DEMO_CREATOR_FIXTURE_ID) ?? createDemoCreator(); },
  getNiches(): Niche[] { return NICHES; },
  getBounties(): Bounty[] { return BOUNTIES.filter(bounty => bounty.status === 'OPEN'); },
  getBounty(id: string): Bounty | undefined { return BOUNTIES.find(bounty => bounty.id === id); },
  computeCreatorPayout(bounty: Bounty, clapScore: number): number {
    return bounty.type === 'INFLUENCER' ? Math.round(bounty.basePayoutCents * clapScore) : bounty.basePayoutCents;
  },
  createAcceptance(creatorId: string, bountyId: string, deadlineHours: number): Acceptance {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);
    const acceptance: Acceptance = {
      id: uuidv4(), bountyId, creatorId, status: 'ACTIVE', acceptedAt: new Date().toISOString(), deadlineAt: deadline.toISOString(),
    };
    acceptances.set(acceptance.id, acceptance);
    return acceptance;
  },
  findAcceptance(creatorId: string, bountyId: string): Acceptance | undefined {
    return Array.from(acceptances.values()).find(item => item.creatorId === creatorId && item.bountyId === bountyId);
  },
  getAcceptanceById(id: string): Acceptance | undefined { return acceptances.get(id); },
  getCreatorAcceptances(creatorId: string): Acceptance[] {
    return Array.from(acceptances.values()).filter(item => item.creatorId === creatorId);
  },
  updateAcceptance(id: string, patch: Partial<Acceptance>): Acceptance | undefined {
    const acceptance = acceptances.get(id);
    if (!acceptance) return undefined;
    const updated = { ...acceptance, ...patch };
    acceptances.set(id, updated);
    return updated;
  },
  createSubmission(data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>): Submission {
    const now = new Date().toISOString();
    const submission: Submission = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
    submissions.set(submission.id, submission);
    return submission;
  },
  getSubmission(id: string): Submission | undefined { return submissions.get(id); },
  updateSubmission(id: string, patch: Partial<Submission>): Submission | undefined {
    const submission = submissions.get(id);
    if (!submission) return undefined;
    const updated = { ...submission, ...patch, updatedAt: new Date().toISOString() };
    submissions.set(id, updated);
    return updated;
  },
  getLatestSubmission(creatorId: string, bountyId: string): Submission | undefined {
    return Array.from(submissions.values())
      .filter(item => !item.isReviewFixture && item.creatorId === creatorId && item.bountyId === bountyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  },
  getLatestSubmissionByAcceptance(acceptanceId: string): Submission | undefined {
    return Array.from(submissions.values())
      .filter(item => !item.isReviewFixture && item.acceptanceId === acceptanceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  },
  getSubmissionByCreateIdempotencyKey(creatorId: string, idempotencyKey: string): Submission | undefined {
    const submissionId = submissionCreateIdempotency.get(`${creatorId}:${idempotencyKey}`);
    return submissionId ? submissions.get(submissionId) : undefined;
  },
  rememberSubmissionCreateIdempotency(creatorId: string, idempotencyKey: string, submissionId: string): void {
    submissionCreateIdempotency.set(`${creatorId}:${idempotencyKey}`, submissionId);
  },
  getSubmissionsForBounty(bountyId: string): Submission[] {
    return Array.from(submissions.values()).filter(item => item.bountyId === bountyId);
  },
  createReviewRound(bountyId: string, submissionIds: string[]): ReviewRound {
    const publicToken = crypto.randomBytes(32).toString('hex');
    const round: ReviewRound = {
      id: uuidv4(), bountyId, publicToken, publicTokenHash: hashToken(publicToken), submissionIds,
      status: 'DRAFT', openedAt: null, closedAt: null, createdAt: new Date().toISOString(),
    };
    reviewRounds.set(round.id, round);
    return round;
  },
  getReviewRound(id: string): ReviewRound | undefined { return reviewRounds.get(id); },
  findReviewRoundBySubmission(submissionId: string): ReviewRound | undefined {
    return Array.from(reviewRounds.values()).find(round => round.submissionIds.includes(submissionId));
  },
  findReviewRoundByToken(token: string): ReviewRound | undefined {
    const tokenHash = hashToken(token);
    return Array.from(reviewRounds.values()).find(round => round.publicTokenHash === tokenHash);
  },
  updateReviewRound(id: string, patch: Partial<ReviewRound>): ReviewRound | undefined {
    const round = reviewRounds.get(id);
    if (!round) return undefined;
    const updated = { ...round, ...patch };
    reviewRounds.set(id, updated);
    return updated;
  },
  findOrCreateReviewerSession(reviewRoundId: string, anonymousToken: string): ReviewerSession {
    const anonymousTokenHash = hashToken(anonymousToken);
    const existing = Array.from(reviewerSessions.values()).find(
      session => session.reviewRoundId === reviewRoundId && session.anonymousTokenHash === anonymousTokenHash,
    );
    if (existing) return existing;
    const session = { id: uuidv4(), reviewRoundId, anonymousTokenHash, createdAt: new Date().toISOString() };
    reviewerSessions.set(session.id, session);
    return session;
  },
  getReviewerSession(id: string): ReviewerSession | undefined { return reviewerSessions.get(id); },
  upsertRating(reviewRoundId: string, reviewerSessionId: string, submissionId: string, score: number): Rating {
    const existing = Array.from(ratings.values()).find(
      rating => rating.reviewerSessionId === reviewerSessionId && rating.submissionId === submissionId,
    );
    if (existing) {
      const updated = { ...existing, score, updatedAt: new Date().toISOString() };
      ratings.set(existing.id, updated);
      return updated;
    }
    const now = new Date().toISOString();
    const rating = { id: uuidv4(), reviewRoundId, reviewerSessionId, submissionId, score, createdAt: now, updatedAt: now };
    ratings.set(rating.id, rating);
    return rating;
  },
  getSessionRatings(reviewerSessionId: string): Rating[] {
    return Array.from(ratings.values()).filter(rating => rating.reviewerSessionId === reviewerSessionId);
  },
  getRatingsForSubmission(submissionId: string): Rating[] {
    return Array.from(ratings.values()).filter(rating => rating.submissionId === submissionId);
  },
  getRatingsForRound(reviewRoundId: string): Rating[] {
    return Array.from(ratings.values()).filter(rating => rating.reviewRoundId === reviewRoundId);
  },
  getSessionRatingForSubmission(reviewerSessionId: string, submissionId: string): Rating | undefined {
    return Array.from(ratings.values()).find(
      rating => rating.reviewerSessionId === reviewerSessionId && rating.submissionId === submissionId,
    );
  },
  computeAndSaveScoreboard(round: ReviewRound): ScoreboardEntry[] {
    const ranked = round.submissionIds.map(submissionId => {
      const submissionRatings = Array.from(ratings.values()).filter(
        rating => rating.reviewRoundId === round.id && rating.submissionId === submissionId,
      );
      const ratingCount = submissionRatings.length;
      const averageScore = ratingCount
        ? submissionRatings.reduce((sum, rating) => sum + rating.score, 0) / ratingCount
        : 0;
      const submission = submissions.get(submissionId);
      return { submissionId, averageScore, ratingCount, submittedAt: submission?.submittedAt ?? submission?.createdAt ?? '' };
    });
    ranked.sort((a, b) =>
      b.averageScore - a.averageScore || b.ratingCount - a.ratingCount
      || a.submittedAt.localeCompare(b.submittedAt) || a.submissionId.localeCompare(b.submissionId));
    const snapshotAt = new Date().toISOString();
    const entries = ranked.map((item, index) => ({
      reviewRoundId: round.id,
      submissionId: item.submissionId,
      rank: index + 1,
      averageScore: Math.round(item.averageScore * 100) / 100,
      ratingCount: item.ratingCount,
      snapshotAt,
    }));
    scoreboardEntries.set(round.id, entries);
    return entries;
  },
  getScoreboard(reviewRoundId: string): ScoreboardEntry[] { return scoreboardEntries.get(reviewRoundId) ?? []; },
  createPayout(data: Omit<Payout, 'id' | 'createdAt'>): { payout: Payout; existed: boolean } {
    const existing = payouts.get(data.idempotencyKey);
    if (existing) return { payout: existing, existed: true };
    const payout = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    payouts.set(payout.idempotencyKey, payout);
    return { payout, existed: false };
  },
  getPayoutsForBounty(bountyId: string): Payout[] {
    return Array.from(payouts.values()).filter(payout => payout.bountyId === bountyId);
  },
  addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): LedgerEntry {
    const fullEntry = { ...entry, id: uuidv4(), createdAt: new Date().toISOString() };
    ledger.set(entry.userId, [fullEntry, ...(ledger.get(entry.userId) ?? [])]);
    return fullEntry;
  },
  getLedger(userId: string): LedgerEntry[] { return ledger.get(userId) ?? []; },
  resetDemo(): void {
    acceptances.clear();
    submissions.clear();
    submissionCreateIdempotency.clear();
    reviewRounds.clear();
    reviewerSessions.clear();
    ratings.clear();
    scoreboardEntries.clear();
    payouts.clear();
    ledger.clear();
    for (const [id, user] of users) users.set(id, { ...user, clapCoinsBalance: 0, trustScore: 100 });
    for (const bounty of BOUNTIES) bounty.status = 'OPEN';
  },
};
