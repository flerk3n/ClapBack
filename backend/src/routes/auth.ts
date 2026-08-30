import { Router, Request, Response } from 'express';
import { db } from '../db/memoryDb';
import { signToken, authMiddleware } from '../middleware/auth';
import { ok, err, ErrorCode } from '../shared/response';

const router = Router();

const DEMO_ADMIN_PIN = process.env.DEMO_ADMIN_PIN ?? '1234';

/**
 * POST /v1/demo/auth/login
 * Demo creator login. Pick one of 3 pre-seeded profiles by PIN + profileIndex.
 * profileIndex: 0 = Micro (8.2k), 1 = Mid (28.5k), 2 = Macro (92k)
 */
router.post('/login', (req: Request, res: Response): void => {
  try {
    const { profileIndex = 0 } = req.body ?? {};
    const user = db.getOrCreateDemoUser(Number(profileIndex));
    const accessToken = signToken({ userId: user.id, role: 'CREATOR' });
    ok(res, req, {
      accessToken,
      creator: mapCreatorProfile(user),
    });
  } catch (e) {
    console.error('[auth] demo login error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Login failed');
  }
});

/**
 * POST /v1/admin/auth/login
 * Demo admin login via PIN.
 */
router.post('/admin-login', (req: Request, res: Response): void => {
  try {
    const { pin } = req.body ?? {};
    if (pin !== DEMO_ADMIN_PIN) {
      err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Invalid admin PIN');
      return;
    }
    const accessToken = signToken({ userId: 'admin', role: 'DEMO_ADMIN' }, '24h');
    ok(res, req, { accessToken });
  } catch (e) {
    console.error('[auth] admin login error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Login failed');
  }
});

/**
 * GET /v1/me
 * Returns the authenticated creator's full profile.
 */
router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const user = db.getUser(userId);
    if (!user) { err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found'); return; }
    ok(res, req, mapCreatorProfile(user));
  } catch (e) {
    console.error('[auth] GET /me error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch profile');
  }
});

/**
 * PUT /v1/me/niches
 * Creator sets their niche preferences.
 * Body: { allNiches: boolean, nicheIds?: number[] }
 */
router.put('/me/niches', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const { allNiches, nicheIds = [] } = req.body ?? {};

    if (typeof allNiches !== 'boolean') {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'allNiches must be a boolean');
      return;
    }
    if (allNiches && nicheIds.length > 0) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'allNiches=true must not include individual nicheIds');
      return;
    }
    if (!allNiches && nicheIds.length === 0) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'Must select at least one niche or set allNiches=true');
      return;
    }

    const validNiches = db.getNiches();
    const validIds = validNiches.map(n => n.id);
    const invalid = nicheIds.filter((id: number) => !validIds.includes(id));
    if (invalid.length > 0) {
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, `Invalid niche IDs: ${invalid.join(', ')}`);
      return;
    }

    const user = db.updateUser(userId, { allNiches, nicheIds });
    if (!user) { err(res, req, 404, ErrorCode.NOT_FOUND, 'User not found'); return; }
    ok(res, req, mapCreatorProfile(user));
  } catch (e) {
    console.error('[auth] PUT /me/niches error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to update niches');
  }
});

/**
 * GET /v1/niches
 * Returns the list of available niches.
 */
router.get('/niches', (_req: Request, res: Response): void => {
  ok(res, _req, db.getNiches());
});

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapCreatorProfile(user: ReturnType<typeof db.getUser>) {
  if (!user) return null;
  const allNiches = db.getNiches();
  const userNiches = user.allNiches
    ? allNiches
    : allNiches.filter(n => user.nicheIds.includes(n.id));
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
    niches: userNiches,
    clapCoinsBalance: user.clapCoinsBalance,
  };
}

export default router;
