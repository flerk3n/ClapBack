import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ─── Enums (matching INTEGRATION_CONTRACT.md §4) ─────────────────────────────

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

// ─── Canonical Niches ─────────────────────────────────────────────────────────

export interface Niche {
  id: number;
  slug: string;
  label: string;
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

// ─── Deliverable types ────────────────────────────────────────────────────────

export interface Deliverable {
  id: string;
  label: string;
  kind: 'SPOKEN_PHRASE' | 'RELEVANCE';
  required: boolean;
  keywords: string[];
  matchMode: 'ALL_KEYWORDS' | 'ANY_KEYWORD' | 'LLM_RELEVANCE';
}

export interface DeliverableCheck {
  deliverableId: string;
  label: string;
  passed: boolean;
  evidence: string;
  confidence: number;
}

// ─── Core entity types ────────────────────────────────────────────────────────

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
  publicToken: string;       // raw token — never stored in production, kept in memory for demo
  publicTokenHash: string;
  submissionIds: string[];
  status: ReviewRoundStatus;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface ReviewerSession {
  id: string;
  reviewRoundId: string;
  anonymousTokenHash: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  reviewRoundId: string;
  reviewerSessionId: string;
  submissionId: string;
  score: number; // 1-5
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

// ─── Helper ───────────────────────────────────────────────────────────────────

function calcClapScore(followers: number): number {
  if (followers < 10_000) return 1.0;
  if (followers < 50_000) return 1.5;
  return 2.0;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Seed bounty fixtures ─────────────────────────────────────────────────────

const BOUNTIES: Bounty[] = [
  {
    id: 'bounty-novaskin-ugc',
    brandName: 'NovaSkin',
    brandLogoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=novaskin&backgroundColor=f8b4b4',
    productName: 'Vitamin C Serum',
    productImageUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=serum&backgroundColor=fef3c7',
    type: 'UGC',
    brief: 'Create a 30–60 second authentic first-impression review of our new Vitamin C Serum. Show it in your morning routine and share your honest thoughts.',
    deliverables: [
      { id: 'd-nova-1', label: 'Say "NovaSkin"', kind: 'SPOKEN_PHRASE', required: true, keywords: ['novaskin', 'nova skin'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-nova-2', label: 'Mention discount code NOVA20', kind: 'SPOKEN_PHRASE', required: true, keywords: ['nova20', 'nova 20'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-nova-3', label: 'Video is relevant to skincare', kind: 'RELEVANCE', required: true, keywords: ['skincare', 'serum', 'skin'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [1],
    basePayoutCents: 15000,
    status: 'OPEN',
    displayDeadline: '48 hours',
    deadlineHours: 48,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bounty-pulsewear-inf',
    brandName: 'PulseWear',
    brandLogoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=pulsewear&backgroundColor=bfdbfe',
    productName: 'PulseWear Pro Tracker',
    productImageUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=tracker&backgroundColor=dbeafe',
    type: 'INFLUENCER',
    brief: 'Unbox and demo the PulseWear Pro tracker in a 60–90 second video. Show off the heart-rate monitoring and fitness goals features.',
    deliverables: [
      { id: 'd-pulse-1', label: 'Say "Track your pulse, own your goals"', kind: 'SPOKEN_PHRASE', required: true, keywords: ['track your pulse', 'own your goals', 'pulsewear'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-pulse-2', label: 'Mention heart rate monitoring', kind: 'SPOKEN_PHRASE', required: true, keywords: ['heart rate', 'heart-rate', 'bpm', 'pulse'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-pulse-3', label: 'Video is relevant to fitness/wearables', kind: 'RELEVANCE', required: true, keywords: ['fitness', 'workout', 'tracker', 'wearable'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [4],
    basePayoutCents: 25000,
    status: 'OPEN',
    displayDeadline: '72 hours',
    deadlineHours: 72,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bounty-zenbrew-ugc',
    brandName: 'ZenBrew',
    brandLogoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=zenbrew&backgroundColor=a7f3d0',
    productName: 'Ceremonial Matcha',
    productImageUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=matcha&backgroundColor=d1fae5',
    type: 'UGC',
    brief: 'Film your peaceful morning ritual using ZenBrew Ceremonial Matcha. Keep it calm, aesthetic, and authentic.',
    deliverables: [
      { id: 'd-zen-1', label: 'Say "ZenBrew"', kind: 'SPOKEN_PHRASE', required: true, keywords: ['zenbrew', 'zen brew'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-zen-2', label: 'Mention code ZEN15', kind: 'SPOKEN_PHRASE', required: true, keywords: ['zen15', 'zen 15', '15% off'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-zen-3', label: 'Video is relevant to matcha/beverages', kind: 'RELEVANCE', required: true, keywords: ['matcha', 'tea', 'morning', 'ritual', 'calm'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [3],
    basePayoutCents: 12000,
    status: 'OPEN',
    displayDeadline: '36 hours',
    deadlineHours: 36,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bounty-urbankicks-inf',
    brandName: 'UrbanKicks',
    brandLogoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=urbankicks&backgroundColor=e9d5ff',
    productName: 'AirFlex Sneaker',
    productImageUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=sneaker&backgroundColor=f3e8ff',
    type: 'INFLUENCER',
    brief: 'Style the new UrbanKicks AirFlex in a street-fashion OOTD video. Show multiple angles and mention the "Midnight Carbon" colorway.',
    deliverables: [
      { id: 'd-urban-1', label: 'Say "Step into the future of street style"', kind: 'SPOKEN_PHRASE', required: true, keywords: ['step into the future', 'street style', 'urbankicks'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-urban-2', label: 'Mention "Midnight Carbon"', kind: 'SPOKEN_PHRASE', required: true, keywords: ['midnight carbon', 'midnight', 'carbon'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-urban-3', label: 'Video is fashion/streetwear relevant', kind: 'RELEVANCE', required: true, keywords: ['fashion', 'ootd', 'style', 'shoes', 'sneakers'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [2],
    basePayoutCents: 30000,
    status: 'OPEN',
    displayDeadline: '24 hours',
    deadlineHours: 24,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bounty-lumeglow-ugc',
    brandName: 'LumeGlow',
    brandLogoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=lumeglow&backgroundColor=fde68a',
    productName: '7-Color LED Face Mask',
    productImageUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=ledmask&backgroundColor=fef9c3',
    type: 'UGC',
    brief: 'First-impression review of the LumeGlow 7-color LED face mask. Show the mask in use and your honest thoughts on the experience.',
    deliverables: [
      { id: 'd-lume-1', label: 'Say "LumeGlow"', kind: 'SPOKEN_PHRASE', required: true, keywords: ['lumeglow', 'lume glow'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-lume-2', label: 'Mention the 30-day glow guarantee', kind: 'SPOKEN_PHRASE', required: true, keywords: ['30 day', '30-day', 'guarantee', 'glow guarantee'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-lume-3', label: 'Mention code LUME25', kind: 'SPOKEN_PHRASE', required: true, keywords: ['lume25', 'lume 25'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-lume-4', label: 'Video is beauty/skincare relevant', kind: 'RELEVANCE', required: true, keywords: ['skin', 'beauty', 'led', 'mask', 'glow', 'face'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [1],
    basePayoutCents: 17500,
    status: 'OPEN',
    displayDeadline: '48 hours',
    deadlineHours: 48,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bounty-novaskin-inf',
    brandName: 'NovaSkin',
    brandLogoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=novaskin&backgroundColor=f8b4b4',
    productName: 'Full Skincare Line',
    productImageUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=skincare&backgroundColor=fef3c7',
    type: 'INFLUENCER',
    brief: 'Showcase your full skincare routine featuring NovaSkin products. Show before/after and demonstrate at least 2 products.',
    deliverables: [
      { id: 'd-novainf-1', label: 'Say "Skin so nova, it glows"', kind: 'SPOKEN_PHRASE', required: true, keywords: ['skin so nova', 'nova', 'it glows'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-novainf-2', label: 'Mention at least 2 NovaSkin products', kind: 'RELEVANCE', required: true, keywords: ['novaskin', 'nova skin', 'serum', 'moisturizer'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [1, 7],
    basePayoutCents: 30000,
    status: 'OPEN',
    displayDeadline: '72 hours',
    deadlineHours: 72,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bounty-pulsewear-ugc',
    brandName: 'PulseWear',
    brandLogoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=pulsewear&backgroundColor=bfdbfe',
    productName: 'PulseWear Pro Tracker',
    productImageUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=tracker&backgroundColor=dbeafe',
    type: 'UGC',
    brief: 'Film a 45-second workout clip wearing the PulseWear tracker. Show real-time calorie tracking.',
    deliverables: [
      { id: 'd-pulsugc-1', label: 'Mention 7-day battery life', kind: 'SPOKEN_PHRASE', required: true, keywords: ['7 day', '7-day', 'seven day', 'battery'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-pulsugc-2', label: 'Use code PULSE10', kind: 'SPOKEN_PHRASE', required: true, keywords: ['pulse10', 'pulse 10'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-pulsugc-3', label: 'Video is fitness relevant', kind: 'RELEVANCE', required: true, keywords: ['workout', 'fitness', 'exercise', 'training', 'gym'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [4],
    basePayoutCents: 13000,
    status: 'OPEN',
    displayDeadline: '48 hours',
    deadlineHours: 48,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bounty-urbankicks-ugc',
    brandName: 'UrbanKicks',
    brandLogoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=urbankicks&backgroundColor=e9d5ff',
    productName: 'Charity Collab Drop',
    productImageUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=charitydrop&backgroundColor=f3e8ff',
    type: 'UGC',
    brief: 'Promote the limited charity collab drop with UrbanKicks x artist VGND. Drive urgency.',
    deliverables: [
      { id: 'd-urbugc-1', label: 'Mention 10% goes to charity', kind: 'SPOKEN_PHRASE', required: true, keywords: ['charity', '10%', 'ten percent', 'donation'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-urbugc-2', label: 'Mention artist name "VGND"', kind: 'SPOKEN_PHRASE', required: true, keywords: ['vgnd'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-urbugc-3', label: 'Video is fashion relevant', kind: 'RELEVANCE', required: true, keywords: ['fashion', 'drop', 'collab', 'limited', 'shoes'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [2, 7],
    basePayoutCents: 10000,
    status: 'OPEN',
    displayDeadline: '24 hours',
    deadlineHours: 24,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bounty-lumeglow-inf',
    brandName: 'LumeGlow',
    brandLogoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=lumeglow&backgroundColor=fde68a',
    productName: 'Glow Up Transformation',
    productImageUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=glowup&backgroundColor=fef9c3',
    type: 'INFLUENCER',
    brief: 'Create a transformation video showing 2-week skin improvement results with LumeGlow.',
    deliverables: [
      { id: 'd-lumeinf-1', label: 'Say "Your glow era starts now"', kind: 'SPOKEN_PHRASE', required: true, keywords: ['glow era', 'starts now', 'lumeglow'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-lumeinf-2', label: 'Mention dermatologist-approved', kind: 'SPOKEN_PHRASE', required: true, keywords: ['dermatologist', 'dermat', 'doctor approved', 'clinically'], matchMode: 'ANY_KEYWORD' },
      { id: 'd-lumeinf-3', label: 'Video is beauty transformation relevant', kind: 'RELEVANCE', required: true, keywords: ['glow', 'transformation', 'before after', 'skin', 'beauty'], matchMode: 'LLM_RELEVANCE' },
    ],
    nicheIds: [1],
    basePayoutCents: 40000,
    status: 'OPEN',
    displayDeadline: '96 hours',
    deadlineHours: 96,
    createdAt: new Date().toISOString(),
  },
];

// ─── Demo creator fixtures ─────────────────────────────────────────────────────

const MOCK_PROFILES = [
  { username: '@alex_creates', displayName: 'Alex Rivera', followersCount: 8200, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
  { username: '@priya.vlogs', displayName: 'Priya Sharma', followersCount: 28500, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya' },
  { username: '@jay_influencer', displayName: 'Jay Kim', followersCount: 92000, avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jay' },
];

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const users = new Map<string, User>();
const acceptances = new Map<string, Acceptance>(); // keyed by acceptance.id
const submissions = new Map<string, Submission>();
const reviewRounds = new Map<string, ReviewRound>();
const reviewerSessions = new Map<string, ReviewerSession>();
const ratings = new Map<string, Rating>(); // keyed by rating.id
const scoreboardEntries = new Map<string, ScoreboardEntry[]>(); // keyed by reviewRoundId
const payouts = new Map<string, Payout>(); // keyed by idempotencyKey
const ledger = new Map<string, LedgerEntry[]>(); // keyed by userId

// ─── DB API ───────────────────────────────────────────────────────────────────

export const db = {
  // ── Users ──────────────────────────────────────────────────────────────────

  createUser(data: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    users.set(user.id, user);
    return user;
  },

  getUser(id: string): User | undefined {
    return users.get(id);
  },

  updateUser(id: string, patch: Partial<User>): User | undefined {
    const user = users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...patch };
    users.set(id, updated);
    return updated;
  },

  findUserByUsername(username: string): User | undefined {
    return Array.from(users.values()).find(u => u.instagramUsername === username);
  },

  getOrCreateDemoUser(profileIndex: number): User {
    const profile = MOCK_PROFILES[Math.min(profileIndex, MOCK_PROFILES.length - 1)];
    const existing = this.findUserByUsername(profile.username);
    if (existing) return existing;
    const followers = profile.followersCount;
    const clapScore = calcClapScore(followers);
    return this.createUser({
      role: 'CREATOR',
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      instagramUsername: profile.username,
      instagramAccountType: 'MEDIA_CREATOR',
      followersCount: followers,
      followsCount: null,
      mediaCount: null,
      clapScore,
      trustScore: 100,
      influencerEligible: followers >= 10_000,
      allNiches: true,
      nicheIds: [],
      clapCoinsBalance: 0,
    });
  },

  // ── Niches ─────────────────────────────────────────────────────────────────

  getNiches(): Niche[] {
    return NICHES;
  },

  // ── Bounties ───────────────────────────────────────────────────────────────

  getBounties(userId?: string): Bounty[] {
    return BOUNTIES.filter(b => b.status === 'OPEN');
  },

  getBounty(id: string): Bounty | undefined {
    return BOUNTIES.find(b => b.id === id);
  },

  computeCreatorPayout(bounty: Bounty, clapScore: number): number {
    if (bounty.type === 'INFLUENCER') {
      return Math.round(bounty.basePayoutCents * clapScore);
    }
    return bounty.basePayoutCents;
  },

  // ── Acceptances ────────────────────────────────────────────────────────────

  createAcceptance(creatorId: string, bountyId: string, deadlineHours: number): Acceptance {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);
    const acceptance: Acceptance = {
      id: uuidv4(),
      bountyId,
      creatorId,
      status: 'ACTIVE',
      acceptedAt: new Date().toISOString(),
      deadlineAt: deadline.toISOString(),
    };
    acceptances.set(acceptance.id, acceptance);
    return acceptance;
  },

  findAcceptance(creatorId: string, bountyId: string): Acceptance | undefined {
    return Array.from(acceptances.values()).find(
      a => a.creatorId === creatorId && a.bountyId === bountyId
    );
  },

  getAcceptanceById(id: string): Acceptance | undefined {
    return acceptances.get(id);
  },

  getCreatorAcceptances(creatorId: string): Acceptance[] {
    return Array.from(acceptances.values()).filter(a => a.creatorId === creatorId);
  },

  updateAcceptance(id: string, patch: Partial<Acceptance>): Acceptance | undefined {
    const a = acceptances.get(id);
    if (!a) return undefined;
    const updated = { ...a, ...patch };
    acceptances.set(id, updated);
    return updated;
  },

  // ── Submissions ────────────────────────────────────────────────────────────

  createSubmission(data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>): Submission {
    const now = new Date().toISOString();
    const sub: Submission = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
    submissions.set(sub.id, sub);
    return sub;
  },

  getSubmission(id: string): Submission | undefined {
    return submissions.get(id);
  },

  updateSubmission(id: string, patch: Partial<Submission>): Submission | undefined {
    const sub = submissions.get(id);
    if (!sub) return undefined;
    const updated = { ...sub, ...patch, updatedAt: new Date().toISOString() };
    submissions.set(id, updated);
    return updated;
  },

  getLatestSubmission(creatorId: string, bountyId: string): Submission | undefined {
    const all = Array.from(submissions.values()).filter(
      s => s.creatorId === creatorId && s.bountyId === bountyId
    );
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  },

  getSubmissionsForBounty(bountyId: string): Submission[] {
    return Array.from(submissions.values()).filter(s => s.bountyId === bountyId);
  },

  // ── Review Rounds ──────────────────────────────────────────────────────────

  createReviewRound(bountyId: string, submissionIds: string[]): ReviewRound {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const round: ReviewRound = {
      id: uuidv4(),
      bountyId,
      publicToken: rawToken,
      publicTokenHash: hashToken(rawToken),
      submissionIds,
      status: 'DRAFT',
      openedAt: null,
      closedAt: null,
      createdAt: new Date().toISOString(),
    };
    reviewRounds.set(round.id, round);
    return round;
  },

  getReviewRound(id: string): ReviewRound | undefined {
    return reviewRounds.get(id);
  },

  findReviewRoundByToken(token: string): ReviewRound | undefined {
    const hash = hashToken(token);
    return Array.from(reviewRounds.values()).find(r => r.publicTokenHash === hash);
  },

  updateReviewRound(id: string, patch: Partial<ReviewRound>): ReviewRound | undefined {
    const r = reviewRounds.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...patch };
    reviewRounds.set(id, updated);
    return updated;
  },

  // ── Reviewer Sessions ──────────────────────────────────────────────────────

  findOrCreateReviewerSession(reviewRoundId: string, anonymousToken: string): ReviewerSession {
    const hash = hashToken(anonymousToken);
    const existing = Array.from(reviewerSessions.values()).find(
      s => s.reviewRoundId === reviewRoundId && s.anonymousTokenHash === hash
    );
    if (existing) return existing;
    const session: ReviewerSession = {
      id: uuidv4(),
      reviewRoundId,
      anonymousTokenHash: hash,
      createdAt: new Date().toISOString(),
    };
    reviewerSessions.set(session.id, session);
    return session;
  },

  getReviewerSession(id: string): ReviewerSession | undefined {
    return reviewerSessions.get(id);
  },

  // ── Ratings ────────────────────────────────────────────────────────────────

  upsertRating(reviewRoundId: string, reviewerSessionId: string, submissionId: string, score: number): Rating {
    const existing = Array.from(ratings.values()).find(
      r => r.reviewerSessionId === reviewerSessionId && r.submissionId === submissionId
    );
    if (existing) {
      const updated: Rating = { ...existing, score, updatedAt: new Date().toISOString() };
      ratings.set(existing.id, updated);
      return updated;
    }
    const now = new Date().toISOString();
    const rating: Rating = {
      id: uuidv4(),
      reviewRoundId,
      reviewerSessionId,
      submissionId,
      score,
      createdAt: now,
      updatedAt: now,
    };
    ratings.set(rating.id, rating);
    return rating;
  },

  getSessionRatings(reviewerSessionId: string): Rating[] {
    return Array.from(ratings.values()).filter(r => r.reviewerSessionId === reviewerSessionId);
  },

  getRatingsForSubmission(submissionId: string): Rating[] {
    return Array.from(ratings.values()).filter(r => r.submissionId === submissionId);
  },

  getRatingsForRound(reviewRoundId: string): Rating[] {
    return Array.from(ratings.values()).filter(r => r.reviewRoundId === reviewRoundId);
  },

  getSessionRatingForSubmission(reviewerSessionId: string, submissionId: string): Rating | undefined {
    return Array.from(ratings.values()).find(
      r => r.reviewerSessionId === reviewerSessionId && r.submissionId === submissionId
    );
  },

  // ── Scoreboard ─────────────────────────────────────────────────────────────

  computeAndSaveScoreboard(round: ReviewRound): ScoreboardEntry[] {
    const entries: Array<{ submissionId: string; avg: number; count: number; submittedAt: string }> = [];

    for (const subId of round.submissionIds) {
      const subRatings = Array.from(ratings.values()).filter(
        r => r.reviewRoundId === round.id && r.submissionId === subId
      );
      const count = subRatings.length;
      const avg = count > 0
        ? subRatings.reduce((sum, r) => sum + r.score, 0) / count
        : 0;
      const sub = submissions.get(subId);
      entries.push({ submissionId: subId, avg, count, submittedAt: sub?.submittedAt ?? sub?.createdAt ?? '' });
    }

    // Sort: avg desc → count desc → submittedAt asc → id asc
    entries.sort((a, b) => {
      if (b.avg !== a.avg) return b.avg - a.avg;
      if (b.count !== a.count) return b.count - a.count;
      if (a.submittedAt !== b.submittedAt) return a.submittedAt.localeCompare(b.submittedAt);
      return a.submissionId.localeCompare(b.submissionId);
    });

    const snapshot = new Date().toISOString();
    const result: ScoreboardEntry[] = entries.map((e, i) => ({
      reviewRoundId: round.id,
      submissionId: e.submissionId,
      rank: i + 1,
      averageScore: Math.round(e.avg * 100) / 100,
      ratingCount: e.count,
      snapshotAt: snapshot,
    }));

    scoreboardEntries.set(round.id, result);
    return result;
  },

  getScoreboard(reviewRoundId: string): ScoreboardEntry[] {
    return scoreboardEntries.get(reviewRoundId) ?? [];
  },

  // ── Payouts ────────────────────────────────────────────────────────────────

  createPayout(data: Omit<Payout, 'id' | 'createdAt'>): { payout: Payout; existed: boolean } {
    const existing = payouts.get(data.idempotencyKey);
    if (existing) return { payout: existing, existed: true };
    const payout: Payout = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    payouts.set(payout.idempotencyKey, payout);
    return { payout, existed: false };
  },

  getPayoutsForBounty(bountyId: string): Payout[] {
    return Array.from(payouts.values()).filter(p => p.bountyId === bountyId);
  },

  // ── Ledger ─────────────────────────────────────────────────────────────────

  addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): LedgerEntry {
    const full: LedgerEntry = { ...entry, id: uuidv4(), createdAt: new Date().toISOString() };
    const entries = ledger.get(entry.userId) ?? [];
    ledger.set(entry.userId, [full, ...entries]);
    return full;
  },

  getLedger(userId: string): LedgerEntry[] {
    return ledger.get(userId) ?? [];
  },

  // ── Reset (demo) ───────────────────────────────────────────────────────────

  resetDemo(): void {
    acceptances.clear();
    submissions.clear();
    reviewRounds.clear();
    reviewerSessions.clear();
    ratings.clear();
    scoreboardEntries.clear();
    payouts.clear();
    ledger.clear();
    // Keep users; reset their balances and trust scores
    for (const [id, user] of users) {
      users.set(id, { ...user, clapCoinsBalance: 0, trustScore: 100 });
    }
    // Reopen closed bounties
    for (const b of BOUNTIES) {
      b.status = 'OPEN';
    }
  },
};
