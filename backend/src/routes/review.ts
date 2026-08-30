import { Router, Request, Response } from 'express';
import { db } from '../db/memoryDb';
import { ok, err, ErrorCode } from '../shared/response';

const router = Router();

/**
 * Middleware or helper to get anonymous reviewer session from header or body
 */
function getReviewerSessionId(req: Request): string | null {
  return (
    (req.headers['x-reviewer-session-id'] as string) ||
    (req.headers['x-reviewer-session'] as string) ||
    req.body?.reviewerSessionId ||
    (req.query?.sessionId as string) ||
    null
  );
}

/**
 * POST /v1/review/:token/session
 * Initializes or restores an anonymous reviewer session for this token.
 */
router.post('/:token/session', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }

    const anonymousToken = req.body?.anonymousToken || `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const session = db.findOrCreateReviewerSession(round.id, anonymousToken);

    ok(res, req, {
      reviewerSessionId: session.id,
      reviewRoundId: round.id,
      status: round.status,
    });
  } catch (e) {
    console.error('[review] session error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to create reviewer session');
  }
});

/**
 * GET /v1/review/:token/feed
 * Returns up to 5 videos for anonymous rating.
 */
router.get('/:token/feed', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }

    const sessionId = getReviewerSessionId(req);
    const sessionRatings = sessionId ? db.getSessionRatings(sessionId) : [];

    const items = round.submissionIds.map(subId => {
      const sub = db.getSubmission(subId);
      const bounty = sub ? db.getBounty(sub.bountyId) : undefined;
      const creator = sub ? db.getUser(sub.creatorId) : undefined;
      const currentRating = sessionRatings.find(r => r.submissionId === subId)?.score ?? null;

      // Local playback URL
      const playbackUrl = sub ? `/uploads/${encodeURIComponent(sub.storagePath.split('/').pop() || '')}` : '';

      return {
        submissionId: subId,
        bountyId: bounty?.id ?? '',
        creatorDisplayName: creator?.displayName ?? 'Creator',
        creatorAvatarUrl: creator?.avatarUrl ?? null,
        brandName: bounty?.brandName ?? 'Brand',
        productName: bounty?.productName ?? 'Product',
        brief: bounty?.brief ?? '',
        playbackUrl,
        playbackUrlExpiresAt: new Date(Date.now() + 86400000).toISOString(),
        currentRating,
      };
    });

    const ratedCount = sessionRatings.filter(r => round.submissionIds.includes(r.submissionId)).length;

    ok(res, req, {
      reviewRoundId: round.id,
      status: round.status,
      items,
      ratedCount,
      totalCount: round.submissionIds.length,
    });
  } catch (e) {
    console.error('[review] feed error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to load review feed');
  }
});

/**
 * PUT /v1/review/:token/ratings/:submissionId
 * Upserts a rating (score 1-5).
 */
router.put('/:token/ratings/:submissionId', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }

    if (round.status !== 'OPEN') {
      err(res, req, 400, ErrorCode.REVIEW_ROUND_NOT_OPEN, 'Review round is closed or not yet open');
      return;
    }

    const submissionId = req.params.submissionId as string;
    if (!round.submissionIds.includes(submissionId)) {
      err(res, req, 404, ErrorCode.SUBMISSION_NOT_IN_ROUND, 'Submission is not part of this review round');
      return;
    }

    const score = Number(req.body?.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      err(res, req, 400, ErrorCode.RATING_OUT_OF_RANGE, 'Rating must be an integer between 1 and 5');
      return;
    }

    let sessionId = getReviewerSessionId(req);
    if (!sessionId) {
      // Auto-create session if not provided
      const newSession = db.findOrCreateReviewerSession(round.id, `anon_${Date.now()}`);
      sessionId = newSession.id;
    }

    db.upsertRating(round.id, sessionId, submissionId, score);

    const sessionRatings = db.getSessionRatings(sessionId);
    const ratedCount = sessionRatings.filter(r => round.submissionIds.includes(r.submissionId)).length;

    ok(res, req, {
      submissionId,
      score,
      reviewerSessionId: sessionId,
      ratedCount,
      totalCount: round.submissionIds.length,
    });
  } catch (e) {
    console.error('[review] rating error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to submit rating');
  }
});

/**
 * GET /v1/review/:token/progress
 */
router.get('/:token/progress', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }

    const sessionId = getReviewerSessionId(req);
    const sessionRatings = sessionId ? db.getSessionRatings(sessionId) : [];
    const ratedCount = sessionRatings.filter(r => round.submissionIds.includes(r.submissionId)).length;

    ok(res, req, {
      ratedCount,
      totalCount: round.submissionIds.length,
      status: round.status,
    });
  } catch (e) {
    console.error('[review] progress error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch progress');
  }
});

/**
 * GET /v1/review/:token/scoreboard
 * Returns frozen scoreboard once closed.
 */
router.get('/:token/scoreboard', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }

    if (round.status !== 'CLOSED') {
      err(res, req, 400, ErrorCode.REVIEW_ROUND_NOT_OPEN, 'Scoreboard is only available after deadline closes');
      return;
    }

    const entries = db.getScoreboard(round.id).map(e => {
      const sub = db.getSubmission(e.submissionId);
      const creator = sub ? db.getUser(sub.creatorId) : undefined;
      const bounty = sub ? db.getBounty(sub.bountyId) : undefined;
      const payoutCents = (sub && bounty && creator) ? db.computeCreatorPayout(bounty, creator.clapScore) : 0;

      return {
        submissionId: e.submissionId,
        rank: e.rank,
        creatorDisplayName: creator?.displayName ?? 'Creator',
        creatorAvatarUrl: creator?.avatarUrl ?? null,
        averageScore: e.averageScore,
        ratingCount: e.ratingCount,
        payoutAmountCents: payoutCents,
        payoutStatus: 'SIMULATED_PAID',
      };
    });

    ok(res, req, {
      status: round.status,
      entries,
    });
  } catch (e) {
    console.error('[review] scoreboard error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch scoreboard');
  }
});

export default router;
