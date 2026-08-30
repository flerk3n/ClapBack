/**
 * Shared response helpers — enforce the contract envelope format:
 *   success: { data: T }
 *   list:    { data: T[], meta: { requestId } }
 *   error:   { error: { code, message, details, requestId } }
 */
import { Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

/** Attach a request ID early in the middleware chain */
export function attachRequestId(req: Request): string {
  const id = (req as any).requestId ?? `req_${uuidv4().slice(0, 8)}`;
  (req as any).requestId = id;
  return id;
}

export function ok<T>(res: Response, req: Request, data: T, status = 200): void {
  res.status(status).json({ data, meta: { requestId: (req as any).requestId } });
}

export function list<T>(res: Response, req: Request, data: T[]): void {
  res.status(200).json({ data, meta: { requestId: (req as any).requestId } });
}

export function err(
  res: Response,
  req: Request,
  status: number,
  code: string,
  message: string,
  details?: unknown
): void {
  res.status(status).json({
    error: {
      code,
      message,
      details: details ?? null,
      requestId: (req as any).requestId ?? null,
    },
  });
}

/** Canonical error codes from the integration contract */
export const ErrorCode = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  BOUNTY_NOT_FOUND: 'BOUNTY_NOT_FOUND',
  BOUNTY_NOT_OPEN: 'BOUNTY_NOT_OPEN',
  CREATOR_NOT_ELIGIBLE: 'CREATOR_NOT_ELIGIBLE',
  ACCEPTANCE_ALREADY_EXISTS: 'ACCEPTANCE_ALREADY_EXISTS',
  INVALID_VIDEO_TYPE: 'INVALID_VIDEO_TYPE',
  VIDEO_TOO_LARGE: 'VIDEO_TOO_LARGE',
  UPLOAD_NOT_FOUND: 'UPLOAD_NOT_FOUND',
  INVALID_SUBMISSION_STATE: 'INVALID_SUBMISSION_STATE',
  PROCESSING_RETRY_NOT_ALLOWED: 'PROCESSING_RETRY_NOT_ALLOWED',
  REVIEW_ROUND_NOT_FOUND: 'REVIEW_ROUND_NOT_FOUND',
  REVIEW_ROUND_NOT_OPEN: 'REVIEW_ROUND_NOT_OPEN',
  SUBMISSION_NOT_IN_ROUND: 'SUBMISSION_NOT_IN_ROUND',
  RATING_OUT_OF_RANGE: 'RATING_OUT_OF_RANGE',
  PAYOUT_ALREADY_EXISTS: 'PAYOUT_ALREADY_EXISTS',
  DEMO_MODE_DISABLED: 'DEMO_MODE_DISABLED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;
