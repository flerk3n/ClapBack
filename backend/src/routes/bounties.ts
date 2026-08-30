import { Router, Request, Response } from 'express';
import { db, Bounty } from '../db/memoryDb';
import { authMiddleware } from '../middleware/auth';
import { ok, list, err, ErrorCode } from '../shared/response';

const router = Router();

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapBounty(bounty: Bounty, clapScore: number, isAccepted = false) {
  const allNiches = db.getNiches();
  return {
    id: bounty.id,
    brandName: bounty.brandName,
    brandLogoUrl: bounty.brandLogoUrl,
    productName: bounty.productName,
    productImageUrl: bounty.productImageUrl,
    type: bounty.type,
    brief: bounty.brief,
    deliverables: bounty.deliverables,
    niches: allNiches.filter(n => bounty.nicheIds.includes(n.id)),
    basePayoutCents: bounty.basePayoutCents,
    creatorPayoutCents: db.computeCreatorPayout(bounty, clapScore),
    creatorClapScore: clapScore,
    status: bounty.status,
    displayDeadline: bounty.displayDeadline,
    deadlineHours: bounty.deadlineHours,
    creatorEligible: bounty.type === 'UGC' || clapScore >= 1.5,
    ineligibilityReason: (bounty.type === 'INFLUENCER' && clapScore < 1.5)
      ? 'You need 10,000+ followers to accept influencer bounties'
      : null,
    isAccepted,
  };
}

/**
 * GET /v1/bounties
 * Returns open bounties, filtered by creator niche if set.
 */
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const user = db.getUser(userId);
    if (!user) { err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found'); return; }

    const allBounties = db.getBounties();

    // Niche filtering: skip if allNiches or no niches set yet
    const filtered = (user.allNiches || user.nicheIds.length === 0)
      ? allBounties
      : allBounties.filter(b =>
          b.type === 'UGC' || // UGC is always shown
          b.nicheIds.some(nid => user.nicheIds.includes(nid))
        );

    const mapped = filtered.map(b => mapBounty(
      b,
      user.clapScore,
      !!db.findAcceptance(userId, b.id)
    ));

    list(res, req, mapped);
  } catch (e) {
    console.error('[bounties] GET / error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch bounties');
  }
});

/**
 * GET /v1/acceptances
 * Returns creator's active acceptances with latest submission summary.
 */
router.get('/acceptances', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const user = db.getUser(userId);
    if (!user) { err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found'); return; }

    const creatorAcceptances = db.getCreatorAcceptances(userId);
    const result = creatorAcceptances.map(a => {
      const bounty = db.getBounty(a.bountyId);
      const latestSub = db.getLatestSubmission(userId, a.bountyId);
      return {
        id: a.id,
        bountyId: a.bountyId,
        creatorId: a.creatorId,
        status: a.status,
        acceptedAt: a.acceptedAt,
        deadlineAt: a.deadlineAt,
        bounty: bounty ? mapBounty(bounty, user.clapScore) : null,
        latestSubmission: latestSub ? mapSubmissionSummary(latestSub) : null,
      };
    });

    list(res, req, result);
  } catch (e) {
    console.error('[bounties] GET /acceptances error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch acceptances');
  }
});

/**
 * POST /v1/bounties/:bountyId/accept
 * Idempotent — returns existing acceptance if already accepted.
 */
router.post('/:bountyId/accept', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const user = db.getUser(userId);
    if (!user) { err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found'); return; }

    const bounty = db.getBounty(req.params.bountyId as string);
    if (!bounty) { err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found'); return; }
    if (bounty.status !== 'OPEN') { err(res, req, 409, ErrorCode.BOUNTY_NOT_OPEN, 'Bounty is no longer accepting submissions'); return; }

    // Eligibility check for INFLUENCER bounties
    if (bounty.type === 'INFLUENCER' && !user.influencerEligible) {
      err(res, req, 403, ErrorCode.CREATOR_NOT_ELIGIBLE, 'You need 10,000+ followers to accept influencer bounties');
      return;
    }

    // Idempotent — return existing
    const existing = db.findAcceptance(userId, bounty.id);
    if (existing) {
      ok(res, req, mapAcceptance(existing, bounty, user.clapScore));
      return;
    }

    const acceptance = db.createAcceptance(userId, bounty.id, bounty.deadlineHours);
    ok(res, req, mapAcceptance(acceptance, bounty, user.clapScore), 201);
  } catch (e) {
    console.error('[bounties] POST /:id/accept error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to accept bounty');
  }
});

/**
 * POST /v1/bounties/:bountyId/decline
 * No state persisted per spec.
 */
router.post('/:bountyId/decline', authMiddleware, (_req: Request, res: Response): void => {
  ok(res, _req, { declined: true });
});

/**
 * POST /v1/bounties/:bountyId/save
 * Bookmarks a bounty (UI convenience, not in contract — kept for mobile compat).
 */
router.post('/:bountyId/save', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const bounty = db.getBounty(req.params.bountyId as string);
    if (!bounty) { err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found'); return; }
    // No-op in new DB (saved bounties removed); return success
    ok(res, req, { saved: true });
  } catch (e) {
    console.error('[bounties] POST /:id/save error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to save bounty');
  }
});

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapAcceptance(a: ReturnType<typeof db.getAcceptanceById>, bounty: Bounty | undefined, clapScore: number) {
  return {
    id: a!.id,
    bountyId: a!.bountyId,
    creatorId: a!.creatorId,
    status: a!.status,
    acceptedAt: a!.acceptedAt,
    deadlineAt: a!.deadlineAt,
    bounty: bounty ? mapBounty(bounty, clapScore) : null,
    latestSubmission: null,
  };
}

function mapSubmissionSummary(s: ReturnType<typeof db.getSubmission>) {
  if (!s) return null;
  return {
    id: s.id,
    bountyId: s.bountyId,
    creatorId: s.creatorId,
    acceptanceId: s.acceptanceId,
    originalFilename: s.originalFilename,
    mimeType: s.mimeType,
    sizeBytes: s.sizeBytes,
    durationSeconds: s.durationSeconds,
    status: s.status,
    failureCode: s.failureCode,
    failureMessage: s.failureMessage,
    aiSummary: s.aiSummary,
    aiConfidence: s.aiConfidence,
    deliverableChecks: s.deliverableChecks,
    createdAt: s.createdAt,
    submittedAt: s.submittedAt,
    updatedAt: s.updatedAt,
  };
}

export { mapSubmissionSummary };
export default router;
