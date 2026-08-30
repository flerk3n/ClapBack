import { Acceptance, Bounty, Submission, User, db } from '../db/memoryDb';

export function mapCreatorProfile(user: User) {
  const allNiches = db.getNiches();
  return {
    userId: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    instagramUsername: user.instagramUsername,
    instagramAccountType: user.instagramAccountType,
    followersCount: user.followersCount,
    followsCount: user.followsCount,
    mediaCount: user.mediaCount,
    clapScore: user.clapScore,
    trustScore: user.trustScore,
    influencerEligible: user.influencerEligible,
    allNiches: user.allNiches,
    niches: user.allNiches ? allNiches : allNiches.filter(niche => user.nicheIds.includes(niche.id)),
    metricsFetchedAt: user.metricsFetchedAt,
  };
}

export function mapBounty(bounty: Bounty, creator: User) {
  const creatorEligible = bounty.type === 'UGC' || creator.influencerEligible;
  return {
    id: bounty.id,
    brandName: bounty.brandName,
    brandLogoUrl: bounty.brandLogoUrl,
    productName: bounty.productName,
    productImageUrl: bounty.productImageUrl,
    type: bounty.type,
    brief: bounty.brief,
    deliverables: bounty.deliverables,
    niches: db.getNiches().filter(niche => bounty.nicheIds.includes(niche.id)),
    basePayoutCents: bounty.basePayoutCents,
    creatorPayoutCents: db.computeCreatorPayout(bounty, creator.clapScore),
    creatorClapScore: creator.clapScore,
    status: bounty.status,
    displayDeadline: bounty.displayDeadline,
    creatorEligible,
    ineligibilityReason: creatorEligible ? null : 'You need 10,000+ followers to accept influencer bounties',
  };
}

export function mapSubmissionSummary(submission: Submission) {
  return {
    id: submission.id,
    bountyId: submission.bountyId,
    creatorId: submission.creatorId,
    acceptanceId: submission.acceptanceId,
    originalFilename: submission.originalFilename,
    mimeType: submission.mimeType,
    sizeBytes: submission.sizeBytes,
    durationSeconds: submission.durationSeconds,
    status: submission.status,
    failureCode: submission.failureCode,
    failureMessage: submission.failureMessage,
    aiSummary: submission.aiSummary,
    aiConfidence: submission.aiConfidence,
    deliverableChecks: submission.deliverableChecks,
    createdAt: submission.createdAt,
    submittedAt: submission.submittedAt,
  };
}

export function mapAcceptance(acceptance: Acceptance) {
  const latestSubmission = db.getLatestSubmissionByAcceptance(acceptance.id);
  return {
    id: acceptance.id,
    bountyId: acceptance.bountyId,
    creatorId: acceptance.creatorId,
    status: acceptance.status,
    acceptedAt: acceptance.acceptedAt,
    latestSubmission: latestSubmission ? mapSubmissionSummary(latestSubmission) : null,
  };
}
