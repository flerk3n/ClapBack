import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { err, ErrorCode } from '../shared/response';

const JWT_SECRET = process.env.JWT_SECRET ?? 'clapback_hackathon_secret_2026';

export interface AuthPayload {
  userId: string;
  role: 'CREATOR' | 'DEMO_ADMIN';
}

/** Attach a requestId to every request */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  (req as any).requestId = `req_${uuidv4().slice(0, 8)}`;
  next();
}

/** Require valid Creator JWT */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Authentication required');
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch (e: any) {
    if (e?.name === 'TokenExpiredError') {
      err(res, req, 401, ErrorCode.AUTH_EXPIRED, 'Token expired');
    } else {
      err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Invalid token');
    }
  }
}

/** Require Demo Admin JWT */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Authentication required');
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (payload.role !== 'DEMO_ADMIN') {
      err(res, req, 403, ErrorCode.FORBIDDEN, 'Admin access required');
      return;
    }
    (req as any).user = payload;
    next();
  } catch {
    err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Invalid token');
  }
}

export function signToken(payload: AuthPayload, expiresIn = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}
