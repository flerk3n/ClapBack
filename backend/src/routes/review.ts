import { Request, Response, Router } from 'express';
import { db, ReviewRound } from '../db/memoryDb';
import { err, ErrorCode, ok } from '../shared/response';

const router = Router();

function getReviewerSessionId(req: Request): string | null {
  return (
    (req.headers['x-reviewer-session-id'] as string) ||
    (req.headers['x-reviewer-session'] as string) ||
    req.body?.reviewerSessionId ||
    (req.query?.sessionId as string) ||
    null
  );
}

function getValidSession(req: Request, res: Response, round: ReviewRound) {
  const sessionId = getReviewerSessionId(req);
  const session = sessionId ? db.getReviewerSession(sessionId) : undefined;
  if (!session || session.reviewRoundId !== round.id) {
    err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Start a reviewer session for this Review Round');
    return null;
  }
  return session;
}

router.post('/:token/session', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }
    if (round.status === 'DRAFT') {
      err(res, req, 409, ErrorCode.REVIEW_ROUND_NOT_OPEN, 'Review round is not open yet');
      return;
    }

    const anonymousToken = req.body?.anonymousToken;
    if (typeof anonymousToken !== 'string' || anonymousToken.length < 8 || anonymousToken.length > 200) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'anonymousToken must contain 8 to 200 characters');
      return;
    }
    const session = db.findOrCreateReviewerSession(round.id, anonymousToken);

    ok(res, req, {
      reviewerSessionId: session.id,
      reviewRoundId: round.id,
      status: round.status,
    });
  } catch (error) {
    console.error('[review] session error:', error);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to create reviewer session');
  }
});

router.get('/:token/feed', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }
    if (round.status === 'DRAFT') {
      err(res, req, 409, ErrorCode.REVIEW_ROUND_NOT_OPEN, 'Review round is not open yet');
      return;
    }
    const session = getValidSession(req, res, round);
    if (!session) return;
    const sessionRatings = db.getSessionRatings(session.id);

    const items = round.submissionIds.flatMap(submissionId => {
      const submission = db.getSubmission(submissionId);
      if (!submission) return [];
      const bounty = db.getBounty(submission.bountyId);
      const creator = db.getUser(submission.creatorId);
      const currentRating = sessionRatings.find(rating => rating.submissionId === submissionId)?.score ?? null;
      const filename = submission.storagePath.split('/').pop() || '';

      return [{
        submissionId,
        bountyId: bounty?.id ?? '',
        creatorDisplayName: creator?.displayName ?? 'Creator',
        creatorAvatarUrl: creator?.avatarUrl ?? null,
        brandName: bounty?.brandName ?? 'Brand',
        productName: bounty?.productName ?? 'Product',
        brief: bounty?.brief ?? '',
        deliverables: bounty?.deliverables.map(deliverable => deliverable.label) ?? [],
        playbackUrl: `/uploads/${encodeURIComponent(filename)}`,
        currentRating,
      }];
    });

    ok(res, req, {
      reviewRoundId: round.id,
      status: round.status,
      items,
      ratedCount: sessionRatings.filter(rating => round.submissionIds.includes(rating.submissionId)).length,
      totalCount: round.submissionIds.length,
    });
  } catch (error) {
    console.error('[review] feed error:', error);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to load review feed');
  }
});

router.put('/:token/ratings/:submissionId', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }
    if (round.status !== 'OPEN') {
      err(res, req, 409, ErrorCode.REVIEW_ROUND_NOT_OPEN, 'Review round is closed or not yet open');
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
    const session = getValidSession(req, res, round);
    if (!session) return;

    db.upsertRating(round.id, session.id, submissionId, score);
    const sessionRatings = db.getSessionRatings(session.id);
    ok(res, req, {
      submissionId,
      score,
      reviewerSessionId: session.id,
      ratedCount: sessionRatings.filter(rating => round.submissionIds.includes(rating.submissionId)).length,
      totalCount: round.submissionIds.length,
    });
  } catch (error) {
    console.error('[review] rating error:', error);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to submit rating');
  }
});

router.get('/:token/progress', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }
    const session = getValidSession(req, res, round);
    if (!session) return;
    const sessionRatings = db.getSessionRatings(session.id);
    ok(res, req, {
      ratedCount: sessionRatings.filter(rating => round.submissionIds.includes(rating.submissionId)).length,
      totalCount: round.submissionIds.length,
      status: round.status,
    });
  } catch (error) {
    console.error('[review] progress error:', error);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch progress');
  }
});

router.get('/:token/scoreboard', (req: Request, res: Response): void => {
  try {
    const round = db.findReviewRoundByToken(req.params.token as string);
    if (!round) {
      err(res, req, 404, ErrorCode.REVIEW_ROUND_NOT_FOUND, 'Review round not found');
      return;
    }
    if (round.status !== 'CLOSED') {
      err(res, req, 409, ErrorCode.REVIEW_ROUND_NOT_OPEN, 'Scoreboard is available after reviewing stops');
      return;
    }

    const entries = db.getScoreboard(round.id).map(entry => {
      const submission = db.getSubmission(entry.submissionId);
      const creator = submission ? db.getUser(submission.creatorId) : undefined;
      return {
        submissionId: entry.submissionId,
        originalFilename: submission?.originalFilename ?? 'Video submission',
        rank: entry.rank,
        creatorDisplayName: creator?.displayName ?? 'Creator',
        creatorAvatarUrl: creator?.avatarUrl ?? null,
        averageScore: entry.averageScore,
        ratingCount: entry.ratingCount,
      };
    });

    ok(res, req, { status: round.status, entries });
  } catch (error) {
    console.error('[review] scoreboard error:', error);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch scoreboard');
  }
});

export default router;
