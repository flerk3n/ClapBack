import { Router, Request, Response } from 'express';
import { db } from '../db/memoryDb';
import { authMiddleware } from '../middleware/auth';
import { ok, err, ErrorCode } from '../shared/response';

const router = Router();

/**
 * GET /v1/ledger
 * Returns the creator's ClapCoins balance, scores, and transaction history.
 */
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const user = db.getUser(userId);
    if (!user) {
      err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found');
      return;
    }

    const entries = db.getLedger(userId);

    ok(res, req, {
      balance: user.clapCoinsBalance,
      trustScore: user.trustScore,
      clapScore: user.clapScore,
      // Backward compatibility fields for mobile store
      trust_score: user.trustScore,
      clap_score: user.clapScore,
      entries,
    });
  } catch (e) {
    console.error('[ledger] GET / error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch ledger');
  }
});

export default router;
