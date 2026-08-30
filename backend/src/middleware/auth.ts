import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { requireEnvironmentValue } from '../shared/config';
import { err, ErrorCode } from '../shared/response';

const JWT_SECRET = requireEnvironmentValue('JWT_SECRET');

export interface AuthPayload {
  userId: string;
  role: 'CREATOR' | 'DEMO_ADMIN';
  tokenType?: 'access' | 'refresh';
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  (req as any).requestId = `req_${uuidv4().slice(0, 8)}`;
  next();
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

function sendTokenError(error: unknown, req: Request, res: Response): void {
  if ((error as { name?: string })?.name === 'TokenExpiredError') {
    err(res, req, 401, ErrorCode.AUTH_EXPIRED, 'Token expired');
  } else {
    err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Invalid token');
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = readToken(req);
  if (!token) {
    err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Authentication required');
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (payload.tokenType !== 'access') {
      err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Invalid token');
      return;
    }
    if (payload.role !== 'CREATOR') {
      err(res, req, 403, ErrorCode.FORBIDDEN, 'Creator access required');
      return;
    }
    (req as any).user = payload;
    next();
  } catch (error) {
    sendTokenError(error, req, res);
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = readToken(req);
  if (!token) {
    err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Authentication required');
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (payload.tokenType !== 'access') {
      err(res, req, 401, ErrorCode.AUTH_REQUIRED, 'Invalid token');
      return;
    }
    if (payload.role !== 'DEMO_ADMIN') {
      err(res, req, 403, ErrorCode.FORBIDDEN, 'Admin access required');
      return;
    }
    (req as any).user = payload;
    next();
  } catch (error) {
    sendTokenError(error, req, res);
  }
}

export function signToken(payload: AuthPayload, expiresIn = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): AuthPayload {
  const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
  if (payload.tokenType !== 'refresh') throw new Error('Invalid refresh token');
  return payload;
}
