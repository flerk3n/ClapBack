import { Request, Response, Router } from 'express';
import { db, DEMO_CREATOR_FIXTURE_ID } from '../db/memoryDb';
import { authMiddleware, signToken, verifyRefreshToken } from '../middleware/auth';
import { requireEnvironmentValue } from '../shared/config';
import { mapCreatorProfile } from '../shared/publicMappers';
import { err, ErrorCode, ok } from '../shared/response';

const router = Router();
const DEMO_CREATOR_PIN = requireEnvironmentValue('DEMO_CREATOR_PIN');

function issueTokenPair(userId: string, role: 'CREATOR' | 'DEMO_ADMIN') {
  return {
    accessToken: signToken({ userId, role, tokenType: 'access' }, '1h'),
    refreshToken: signToken({ userId, role, tokenType: 'refresh' }, '7d'),
  };
}

router.post('/demo/auth/login', (req: Request, res: Response): void => {
  try {
    const { pin, creatorFixtureId } = req.body ?? {};
    if (typeof pin !== 'string' || typeof creatorFixtureId !== 'string') {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'pin and creatorFixtureId are required');
      return;
    }
    if (pin !== DEMO_CREATOR_PIN) {
      err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Invalid Creator PIN');
      return;
    }
    if (creatorFixtureId !== DEMO_CREATOR_FIXTURE_ID) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'Unknown Creator fixture');
      return;
    }

    const user = db.getOrCreateDemoUser();
    ok(res, req, {
      ...issueTokenPair(user.id, 'CREATOR'),
      creator: mapCreatorProfile(user),
    });
  } catch (error) {
    console.error('[auth] demo login failed');
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Login failed');
  }
});

router.post('/auth/refresh', (req: Request, res: Response): void => {
  try {
    const { refreshToken } = req.body ?? {};
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'refreshToken is required');
      return;
    }

    // Local prototype only: refresh tokens are signed and verified but are not persisted or revocable.
    const payload = verifyRefreshToken(refreshToken);
    ok(res, req, issueTokenPair(payload.userId, payload.role));
  } catch (error) {
    if ((error as { name?: string })?.name === 'TokenExpiredError') {
      err(res, req, 401, ErrorCode.AUTH_EXPIRED, 'Refresh token expired');
    } else {
      err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Invalid refresh token');
    }
  }
});

router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  const { userId } = (req as any).user;
  const user = db.getUser(userId);
  if (!user) {
    err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found');
    return;
  }
  ok(res, req, mapCreatorProfile(user));
});

router.put('/me/niches', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const { allNiches, nicheIds = [] } = req.body ?? {};
    if (typeof allNiches !== 'boolean' || !Array.isArray(nicheIds)) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'allNiches and nicheIds are invalid');
      return;
    }
    if ((allNiches && nicheIds.length > 0) || (!allNiches && nicheIds.length === 0)) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'Select individual niches or set allNiches=true');
      return;
    }
    const validIds = db.getNiches().map(niche => niche.id);
    if (nicheIds.some((id: unknown) => !Number.isInteger(id) || !validIds.includes(id as number))) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'One or more niche IDs are invalid');
      return;
    }
    const user = db.updateUser(userId, { allNiches, nicheIds });
    if (!user) {
      err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found');
      return;
    }
    ok(res, req, mapCreatorProfile(user));
  } catch (error) {
    console.error('[auth] niche update failed');
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to update niches');
  }
});

router.get('/niches', (req: Request, res: Response): void => {
  ok(res, req, db.getNiches());
});

export default router;
