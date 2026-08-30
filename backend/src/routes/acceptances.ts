import { Request, Response, Router } from 'express';
import { db } from '../db/memoryDb';
import { authMiddleware } from '../middleware/auth';
import { mapAcceptance } from '../shared/publicMappers';
import { err, ErrorCode, list } from '../shared/response';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    if (!db.getUser(userId)) {
      err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found');
      return;
    }
    list(res, req, db.getCreatorAcceptances(userId).map(mapAcceptance));
  } catch (error) {
    console.error('[acceptances] list failed');
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch acceptances');
  }
});

export default router;
