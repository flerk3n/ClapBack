import {
  bountySchema,
  creatorProfileSchema,
  type Bounty,
  type CreatorProfile,
  type Niche,
} from '../../contracts/src';

export const niches: Niche[] = [
  { id: 1, slug: 'beauty', label: 'Beauty' },
  { id: 2, slug: 'fashion', label: 'Fashion' },
  { id: 3, slug: 'food', label: 'Food' },
  { id: 4, slug: 'fitness', label: 'Fitness' },
  { id: 5, slug: 'gaming', label: 'Gaming' },
  { id: 6, slug: 'technology', label: 'Technology' },
  { id: 7, slug: 'lifestyle', label: 'Lifestyle' },
];

export const DEMO_CREATOR_FIXTURE_ID = 'ebf4b0b2-d96f-47d2-8f27-60139947f6b8';
export const UNIQLO_MENS_OUTFIT_HAUL_BOUNTY_ID = 'e332e380-c016-4c42-8b3f-a8e393a6ae93';

export const demoCreator: CreatorProfile = creatorProfileSchema.parse({
  userId: DEMO_CREATOR_FIXTURE_ID,
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
  niches: [],
  metricsFetchedAt: '2026-08-30T07:00:00.000Z',
});

const [beauty, fashion, food, fitness, gaming, technology, lifestyle] = niches;

export const demoBounties: Bounty[] = bountySchema.array().parse([
  {
    id: 'b4fd66c8-8434-4a12-814b-b9c04f835900',
    brandName: 'GlowPop',
    brandLogoUrl: 'fixture://glowpop',
    productName: 'Hydra Cloud Serum',
    productImageUrl: 'fixture://hydra-cloud',
    type: 'UGC',
    brief: 'Make hydration feel irresistible in a crisp, honest skincare recommendation.',
    deliverables: [
      { id: 'brand', label: 'Say “GlowPop”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['GlowPop'], matchMode: 'ALL_KEYWORDS' },
      { id: 'offer', label: 'Mention “20% off”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['20% off'], matchMode: 'ALL_KEYWORDS' },
      { id: 'code', label: 'Say the code “CLAP20”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['CLAP20'], matchMode: 'ALL_KEYWORDS' },
    ],
    niches: [beauty, lifestyle],
    basePayoutCents: 15000,
    creatorPayoutCents: 15000,
    creatorClapScore: 1.5,
    status: 'OPEN',
    displayDeadline: 'Closes at 8:00 PM',
    creatorEligible: true,
    ineligibilityReason: null,
  },
  {
    id: 'ccfbe460-c852-49f8-a2fd-0032e7553f61',
    brandName: 'Aster Run',
    brandLogoUrl: 'fixture://aster-run',
    productName: 'Form 02 Trainer',
    productImageUrl: 'fixture://form-trainer',
    type: 'INFLUENCER',
    brief: 'Show the one detail that makes your everyday run feel more considered.',
    deliverables: [
      { id: 'brand', label: 'Mention “Aster Run”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['Aster Run'], matchMode: 'ALL_KEYWORDS' },
      { id: 'comfort', label: 'Talk about all-day comfort', kind: 'RELEVANCE', required: true, keywords: ['comfort'], matchMode: 'LLM_RELEVANCE' },
    ],
    niches: [fitness, fashion],
    basePayoutCents: 18000,
    creatorPayoutCents: 27000,
    creatorClapScore: 1.5,
    status: 'OPEN',
    displayDeadline: '2 days left',
    creatorEligible: true,
    ineligibilityReason: null,
  },
  {
    id: '4cd42158-b24b-493b-b945-87385627a735',
    brandName: 'Nori House',
    brandLogoUrl: 'fixture://nori-house',
    productName: 'Tokyo Crunch Kit',
    productImageUrl: 'fixture://tokyo-crunch',
    type: 'UGC',
    brief: 'Turn the first bite into a tiny cinematic moment—texture, sound, reaction.',
    deliverables: [
      { id: 'brand', label: 'Say “Nori House”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['Nori House'], matchMode: 'ALL_KEYWORDS' },
      { id: 'reaction', label: 'Include your first-bite reaction', kind: 'RELEVANCE', required: true, keywords: ['first bite'], matchMode: 'LLM_RELEVANCE' },
    ],
    niches: [food, lifestyle],
    basePayoutCents: 12000,
    creatorPayoutCents: 12000,
    creatorClapScore: 1.5,
    status: 'OPEN',
    displayDeadline: 'Closes tomorrow',
    creatorEligible: true,
    ineligibilityReason: null,
  },
  {
    id: '8b0cce8a-761e-40e4-930e-1941a670f920',
    brandName: 'Softbyte',
    brandLogoUrl: 'fixture://softbyte',
    productName: 'Pocket Mic Mini',
    productImageUrl: 'fixture://pocket-mic',
    type: 'INFLUENCER',
    brief: 'Show how cleaner sound changes an ordinary creator setup.',
    deliverables: [
      { id: 'brand', label: 'Mention “Softbyte”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['Softbyte'], matchMode: 'ALL_KEYWORDS' },
      { id: 'sound', label: 'Compare the before and after sound', kind: 'RELEVANCE', required: true, keywords: ['sound'], matchMode: 'LLM_RELEVANCE' },
    ],
    niches: [technology, gaming],
    basePayoutCents: 20000,
    creatorPayoutCents: 30000,
    creatorClapScore: 1.5,
    status: 'OPEN',
    displayDeadline: '3 days left',
    creatorEligible: true,
    ineligibilityReason: null,
  },
  {
    id: UNIQLO_MENS_OUTFIT_HAUL_BOUNTY_ID,
    brandName: 'Uniqlo',
    brandLogoUrl: 'fixture://uniqlo',
    productName: "Men's Outfit Haul",
    productImageUrl: 'fixture://uniqlo-mens-outfit-haul',
    type: 'UGC',
    brief: "Show and describe a men’s T-shirt from your Uniqlo haul in under 1 minute.",
    deliverables: [
      { id: 'mens-tshirt', label: 'Show a men’s T-shirt', kind: 'RELEVANCE', required: true, keywords: ["men’s T-shirt", "men's T-shirt", 'mens T-shirt', 'T-shirt', 'Tshirt', 'tee'], matchMode: 'LLM_RELEVANCE' },
      { id: 'under-1-minute', label: 'Keep the video under 1 minute', kind: 'MAX_DURATION', required: true, maxDurationSeconds: 60 },
    ],
    niches: [fashion, lifestyle],
    basePayoutCents: 15000,
    creatorPayoutCents: 15000,
    creatorClapScore: 1.5,
    status: 'OPEN',
    displayDeadline: '3 days left',
    creatorEligible: true,
    ineligibilityReason: null,
  },
  {
    id: '195509a2-2a00-4ba5-bf4a-383599e5cc64',
    brandName: 'Still Sunday',
    brandLogoUrl: 'fixture://still-sunday',
    productName: 'Everyday Carry Tote',
    productImageUrl: 'fixture://carry-tote',
    type: 'UGC',
    brief: 'A quiet “what fits in my bag” edit with your real everyday essentials.',
    deliverables: [
      { id: 'brand', label: 'Say “Still Sunday”', kind: 'SPOKEN_PHRASE', required: true, keywords: ['Still Sunday'], matchMode: 'ALL_KEYWORDS' },
      { id: 'items', label: 'Show at least three essentials', kind: 'RELEVANCE', required: true, keywords: ['essentials'], matchMode: 'LLM_RELEVANCE' },
    ],
    niches: [fashion, lifestyle],
    basePayoutCents: 17500,
    creatorPayoutCents: 17500,
    creatorClapScore: 1.5,
    status: 'OPEN',
    displayDeadline: '4 days left',
    creatorEligible: true,
    ineligibilityReason: null,
  },
]);

export type BountyVisual = {
  colors: readonly [string, string, ...string[]];
  accent: string;
  motif: 'orb' | 'shoe' | 'bowl' | 'mic' | 'tote';
  productLabel: string;
};

export const bountyVisuals: Record<string, BountyVisual> = {
  'b4fd66c8-8434-4a12-814b-b9c04f835900': { colors: ['#D8B8AC', '#A76556', '#50332E'], accent: '#F7E7DF', motif: 'orb', productLabel: 'HYDRA' },
  'ccfbe460-c852-49f8-a2fd-0032e7553f61': { colors: ['#AAB5A3', '#536B5D', '#263A32'], accent: '#EDF0E7', motif: 'shoe', productLabel: 'FORM 02' },
  '4cd42158-b24b-493b-b945-87385627a735': { colors: ['#E0B56F', '#AD673D', '#5C3029'], accent: '#FFF0CF', motif: 'bowl', productLabel: 'CRUNCH' },
  '8b0cce8a-761e-40e4-930e-1941a670f920': { colors: ['#A8B7BB', '#5C737A', '#2D3D42'], accent: '#E8F0F1', motif: 'mic', productLabel: 'MINI' },
  [UNIQLO_MENS_OUTFIT_HAUL_BOUNTY_ID]: { colors: ['#D7D7D2', '#8B8E89', '#383A38'], accent: '#F7F7F2', motif: 'tote', productLabel: 'OUTFIT' },
  '195509a2-2a00-4ba5-bf4a-383599e5cc64': { colors: ['#C9B89F', '#8B7055', '#493A2C'], accent: '#F4EBDD', motif: 'tote', productLabel: 'CARRY' },
};
