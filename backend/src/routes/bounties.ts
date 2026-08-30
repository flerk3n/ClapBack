import { Request, Response, Router } from 'express';
import { db } from '../db/memoryDb';
import { authMiddleware } from '../middleware/auth';
import { mapAcceptance, mapBounty } from '../shared/publicMappers';
import { err, ErrorCode, list, ok } from '../shared/response';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const user = db.getUser(userId);
    if (!user) {
      err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found');
      return;
    }
    const visibleBounties = (user.allNiches || user.nicheIds.length === 0)
      ? db.getBounties()
      : db.getBounties().filter(
          bounty => bounty.type === 'UGC' || bounty.nicheIds.some(nicheId => user.nicheIds.includes(nicheId)),
        );
    list(res, req, visibleBounties.map(bounty => mapBounty(bounty, user)));
  } catch (error) {
    console.error('[bounties] list failed');
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch bounties');
  }
});

router.post('/:bountyId/accept', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const user = db.getUser(userId);
    if (!user) {
      err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found');
      return;
    }
    const bounty = db.getBounty(req.params.bountyId as string);
    if (!bounty) {
      err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found');
      return;
    }
    if (bounty.status !== 'OPEN') {
      err(res, req, 409, ErrorCode.BOUNTY_NOT_OPEN, 'Bounty is no longer accepting submissions');
      return;
    }
    if (bounty.type === 'INFLUENCER' && !user.influencerEligible) {
      err(res, req, 403, ErrorCode.CREATOR_NOT_ELIGIBLE, 'You need 10,000+ followers to accept influencer bounties');
      return;
    }
    const existing = db.findAcceptance(userId, bounty.id);
    if (existing) {
      ok(res, req, mapAcceptance(existing));
      return;
    }
    const acceptance = db.createAcceptance(userId, bounty.id, bounty.deadlineHours);
    ok(res, req, mapAcceptance(acceptance), 201);
  } catch (error) {
    console.error('[bounties] accept failed');
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to accept bounty');
  }
});

router.post('/:bountyId/decline', authMiddleware, (req: Request, res: Response): void => {
  if (!db.getBounty(req.params.bountyId as string)) {
    err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found');
    return;
  }
  ok(res, req, { declined: true });
});

router.post('/:bountyId/save', authMiddleware, (req: Request, res: Response): void => {
  if (!db.getBounty(req.params.bountyId as string)) {
    err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found');
    return;
  }
  ok(res, req, { saved: true });
});

export default router;
