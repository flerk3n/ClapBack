import { Request, Response, Router } from 'express';
import { db, ReviewRound } from '../db/memoryDb';
import { adminMiddleware, signToken } from '../middleware/auth';
import { requireEnvironmentValue } from '../shared/config';
import { err, ErrorCode, ok } from '../shared/response';

const router = Router();
const DEMO_ADMIN_PIN = requireEnvironmentValue('DEMO_ADMIN_PIN');

router.post('/auth/login', (req: Request, res: Response): void => {
  const { pin } = req.body ?? {};
  if (typeof pin !== 'string' || pin !== DEMO_ADMIN_PIN) {
    err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Invalid admin PIN');
    return;
  }
  const accessToken = signToken({ userId: 'admin', role: 'DEMO_ADMIN', tokenType: 'access' }, '24h');
  ok(res, req, { accessToken });
});

router.use(adminMiddleware);

/**
 * POST /v1/admin/review-rounds
 * Creates a review round for a bounty with up to 5 AI_PASSED submissions.
 */
router.post('/review-rounds', (req: Request, res: Response): void => {
  try {
    const { bountyId, submissionIds = [] } = req.body ?? {};

    if (!bountyId) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'bountyId is required');
      return;
    }

    const bounty = db.getBounty(bountyId);
    if (!bounty) {
      err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found');
      return;
    }

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'Must provide at least 1 submissionId');
      return;
    }

    if (submissionIds.length > 5) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'Maximum 5 submissions allowed per review round');
      return;
    }

    // Verify all submissions exist, belong to bounty, and are AI_PASSED
    for (const subId of submissionIds) {
      const sub = db.getSubmission(subId);
      if (!sub || sub.bountyId !== bountyId) {
        err(res, req, 400, ErrorCode.VALIDATION_ERROR, `Submission ${subId} does not belong to bounty ${bountyId}`);
        return;
      }
      if (sub.status !== 'AI_PASSED' && sub.status !== 'IN_REVIEW' && sub.status !== 'SCORED') {
        err(res, req, 400, ErrorCode.VALIDATION_ERROR, `Submission ${subId} has not passed AI verification (status: ${sub.status})`);
        return;
      }
    }

    const round = db.createReviewRound(bountyId, submissionIds);
    ok(res, req, round, 201);
  } catch (e) {
    console.error('[admin] create round error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to create review round');
  }
});

/**
 * POST /v1/admin/review-rounds/:reviewRoundId/open
 * Opens the round for public reviewer rating.
 */
router.post('/review-rounds/:reviewRoundId/open', (req: Request, res: Response): void => {
  try {
    const round = db.getReviewRound(req.params.reviewRoundId as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }

    if (round.status === 'CLOSED') {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'Cannot re-open a closed review round');
      return;
    }

    const updated = db.updateReviewRound(round.id, {
      status: 'OPEN',
      openedAt: new Date().toISOString(),
    });

    // Mark member submissions as IN_REVIEW
    for (const subId of round.submissionIds) {
      db.updateSubmission(subId, { status: 'IN_REVIEW' });
    }

    const baseUrl = (process.env.PUBLIC_BASE_URL?.trim() || `${req.protocol}://${req.get('host') || 'localhost:3001'}`).replace(/\/$/, '');
    const reviewUrl = `${baseUrl}/review/${round.publicToken}`;

    ok(res, req, {
      reviewRound: updated,
      publicToken: round.publicToken,
      reviewUrl,
    });
  } catch (e) {
    console.error('[admin] open round error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to open review round');
  }
});

/**
 * POST /v1/admin/review-rounds/:reviewRoundId/close
 * Closes ratings, computes and freezes the scoreboard.
 */
router.post('/review-rounds/:reviewRoundId/close', (req: Request, res: Response): void => {
  try {
    const round = db.getReviewRound(req.params.reviewRoundId as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }

    if (round.status === 'CLOSED') {
      // Idempotent: return existing scoreboard
      const entries = db.getScoreboard(round.id);
      ok(res, req, { reviewRound: round, scoreboard: entries });
      return;
    }

    // Freeze round
    const updated = db.updateReviewRound(round.id, {
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
    });

    // Compute frozen scoreboard entries
    const scoreboard = db.computeAndSaveScoreboard(round);

    // Mark submissions SCORED
    for (const subId of round.submissionIds) {
      db.updateSubmission(subId, { status: 'SCORED' });
    }

    // Mark bounty CLOSED
    const bounty = db.getBounty(round.bountyId);
    if (bounty) {
      bounty.status = 'CLOSED';
    }

    ok(res, req, {
      reviewRound: updated,
      scoreboard,
    });
  } catch (e) {
    console.error('[admin] close round error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to close review round');
  }
});

/**
 * GET /v1/admin/bounties/:bountyId/results
 */
router.get('/bounties/:bountyId/results', (req: Request, res: Response): void => {
  try {
    const bounty = db.getBounty(req.params.bountyId as string);
    if (!bounty) {
      err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found');
      return;
    }

    const subs = db.getSubmissionsForBounty(bounty.id);
    const payouts = db.getPayoutsForBounty(bounty.id);

    const submissionResults = subs.map(s => {
      const creator = db.getUser(s.creatorId);
      const subRatings = db.getRatingsForSubmission(s.id);
      const avgScore = subRatings.length > 0
        ? Math.round((subRatings.reduce((sum, r) => sum + r.score, 0) / subRatings.length) * 100) / 100
        : 0;

      return {
        id: s.id,
        creatorDisplayName: creator?.displayName ?? 'Creator',
        creatorHandle: creator?.instagramUsername ?? '@creator',
        status: s.status,
        deliverableChecks: s.deliverableChecks,
        ratingCount: subRatings.length,
        averageScore: avgScore,
        payoutStatus: payouts.some(p => p.submissionId === s.id) ? 'SIMULATED_PAID' : null,
      };
    });

    ok(res, req, {
      bountyId: bounty.id,
      brandName: bounty.brandName,
      productName: bounty.productName,
      status: bounty.status,
      submissions: submissionResults,
      payouts,
    });
  } catch (e) {
    console.error('[admin] bounty results error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch bounty results');
  }
});

/**
 * POST /v1/admin/payouts/ugc
 * Single winner UGC buyout.
 */
router.post('/payouts/ugc', (req: Request, res: Response): void => {
  try {
    const { bountyId, submissionId } = req.body ?? {};

    if (!bountyId || !submissionId) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'bountyId and submissionId are required');
      return;
    }

    const bounty = db.getBounty(bountyId);
    if (!bounty) { err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found'); return; }

    const sub = db.getSubmission(submissionId);
    if (!sub || sub.bountyId !== bountyId) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'Submission does not match bounty');
      return;
    }

    const idempotencyKey = `payout:ugc:${bountyId}:${submissionId}`;
    const { payout, existed } = db.createPayout({
      bountyId,
      submissionId,
      creatorId: sub.creatorId,
      payoutKind: 'UGC_BUYOUT',
      amountCents: bounty.basePayoutCents,
      status: 'SIMULATED_PAID',
      idempotencyKey,
    });

    // Credit ledger if freshly created
    if (!existed) {
      db.addLedgerEntry({
        userId: sub.creatorId,
        amount: Math.round(bounty.basePayoutCents / 100),
        type: 'earn',
        description: `UGC Buyout: "${bounty.productName}" ($${(bounty.basePayoutCents / 100).toFixed(2)})`,
      });
    }

    ok(res, req, payout, existed ? 200 : 201);
  } catch (e) {
    console.error('[admin] ugc payout error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to process UGC payout');
  }
});

/**
 * POST /v1/admin/payouts/influencers
 * Multi-recipient influencer payouts.
 */
router.post('/payouts/influencers', (req: Request, res: Response): void => {
  try {
    const { bountyId, submissionIds = [] } = req.body ?? {};

    if (!bountyId || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'bountyId and submissionIds[] are required');
      return;
    }

    const bounty = db.getBounty(bountyId);
    if (!bounty) { err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found'); return; }

    const results = [];

    for (const subId of submissionIds) {
      const sub = db.getSubmission(subId);
      if (!sub || sub.bountyId !== bountyId) continue;

      const creator = db.getUser(sub.creatorId);
      const clapScore = creator?.clapScore ?? 1.0;
      const amountCents = db.computeCreatorPayout(bounty, clapScore);

      const idempotencyKey = `payout:inf:${bountyId}:${subId}`;
      const { payout, existed } = db.createPayout({
        bountyId,
        submissionId: subId,
        creatorId: sub.creatorId,
        payoutKind: 'INFLUENCER_REWARD',
        amountCents,
        status: 'SIMULATED_PAID',
        idempotencyKey,
      });

      if (!existed) {
        db.addLedgerEntry({
          userId: sub.creatorId,
          amount: Math.round(amountCents / 100),
          type: 'earn',
          description: `Influencer Reward: "${bounty.productName}" ($${(amountCents / 100).toFixed(2)})`,
        });
      }

      results.push(payout);
    }

    ok(res, req, results);
  } catch (e) {
    console.error('[admin] influencer payouts error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to process influencer payouts');
  }
});

/**
 * POST /v1/admin/demo/reset
 * Wipes demo transactional data and resets state.
 */
router.post('/demo/reset', (req: Request, res: Response): void => {
  try {
    const { confirmation } = req.body ?? {};
    if (confirmation !== 'RESET_DEMO') {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'Must provide confirmation: "RESET_DEMO"');
      return;
    }

    db.resetDemo();
    ok(res, req, { reset: true, message: 'Demo data reset successfully.' });
  } catch (e) {
    console.error('[admin] reset error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to reset demo data');
  }
});

export default router;
