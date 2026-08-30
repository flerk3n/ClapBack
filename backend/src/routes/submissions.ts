import { NextFunction, Request, Response, Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { db } from '../db/memoryDb';
import { authMiddleware } from '../middleware/auth';
import { transcribeMedia } from '../services/elevenLabs';
import { verifyDeliverablesStructured } from '../services/llmVerifier';
import { mapSubmissionSummary } from '../shared/publicMappers';
import { err, ErrorCode, ok } from '../shared/response';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;
const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, UPLOADS_DIR),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname) || '.mp4';
    callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const isMp4 = file.mimetype === 'video/mp4' && file.originalname.toLowerCase().endsWith('.mp4');
    if (!isMp4) {
      callback(new Error('INVALID_VIDEO_TYPE'));
      return;
    }
    callback(null, true);
  },
});

function uploadLocalMp4(req: Request, res: Response, next: NextFunction): void {
  upload.single('video')(req, res, error => {
    if (!error) {
      next();
      return;
    }
    const code = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      ? ErrorCode.VIDEO_TOO_LARGE
      : ErrorCode.INVALID_VIDEO_TYPE;
    const message = code === ErrorCode.VIDEO_TOO_LARGE
      ? 'MP4 file exceeds the 100 MB local upload limit'
      : 'A valid MP4 file is required';
    err(res, req, 400, code, message);
  });
}

function deleteUploadedFile(file: Express.Multer.File | undefined): void {
  if (!file) return;
  try {
    fs.unlinkSync(file.path);
  } catch {
    console.warn('[submissions] Could not remove rejected local upload');
  }
}

async function processSubmission(submissionId: string): Promise<void> {
  const submission = db.getSubmission(submissionId);
  if (!submission) return;
  const bounty = db.getBounty(submission.bountyId);
  if (!bounty) {
    db.updateSubmission(submissionId, {
      status: 'PROCESSING_ERROR',
      failureCode: 'BOUNTY_NOT_FOUND',
      failureMessage: 'Video processing could not be completed. Please try again.',
    });
    return;
  }

  db.updateSubmission(submissionId, { status: 'TRANSCRIBING' });
  try {
    const transcript = await transcribeMedia(
      submission.storagePath,
      submission.originalFilename,
      submission.mimeType,
    );
    db.updateSubmission(submissionId, { transcript, status: 'EVALUATING' });
    const verification = await verifyDeliverablesStructured(bounty.brief, bounty.deliverables, transcript);

    if (verification.passed) {
      db.updateSubmission(submissionId, {
        status: 'AI_PASSED',
        aiSummary: verification.aiSummary,
        aiConfidence: verification.aiConfidence,
        deliverableChecks: verification.checks,
        failureCode: null,
        failureMessage: null,
        submittedAt: new Date().toISOString(),
      });
      db.updateAcceptance(submission.acceptanceId, { status: 'SUBMITTED' });
      return;
    }

    db.updateSubmission(submissionId, {
      status: 'AI_FAILED',
      aiSummary: verification.aiSummary,
      aiConfidence: verification.aiConfidence,
      deliverableChecks: verification.checks,
      failureCode: 'DELIVERABLES_NOT_MET',
      failureMessage: verification.failureMessage ?? 'Video failed required deliverable checks.',
    });
    const creator = db.getUser(submission.creatorId);
    if (creator) db.updateUser(creator.id, { trustScore: Math.max(0, creator.trustScore - 5) });
  } catch {
    console.error(`[pipeline] Submission ${submissionId} processing failed`);
    db.updateSubmission(submissionId, {
      status: 'PROCESSING_ERROR',
      failureCode: 'PROCESSING_FAILED',
      failureMessage: 'Video processing could not be completed. Please try again.',
    });
  }
}

router.post('/', authMiddleware, uploadLocalMp4, (req: Request, res: Response): void => {
  const uploadedFile = req.file;
  try {
    const { userId } = (req as any).user;
    const { acceptanceId } = req.body ?? {};
    if (!uploadedFile) {
      err(res, req, 400, ErrorCode.UPLOAD_NOT_FOUND, 'Attach an MP4 file in the video multipart field');
      return;
    }

    const idempotencyKey = req.get('Idempotency-Key')?.trim();
    if (!idempotencyKey || idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
      deleteUploadedFile(uploadedFile);
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'Idempotency-Key must contain 1 to 200 characters');
      return;
    }

    const replayedSubmission = db.getSubmissionByCreateIdempotencyKey(userId, idempotencyKey);
    if (replayedSubmission) {
      deleteUploadedFile(uploadedFile);
      ok(res, req, { submission: mapSubmissionSummary(replayedSubmission) });
      return;
    }

    if (typeof acceptanceId !== 'string' || !UUID_PATTERN.test(acceptanceId)) {
      deleteUploadedFile(uploadedFile);
      err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'acceptanceId must be a UUID');
      return;
    }

    const acceptance = db.getAcceptanceById(acceptanceId);
    if (!acceptance) {
      deleteUploadedFile(uploadedFile);
      err(res, req, 404, ErrorCode.NOT_FOUND, 'Acceptance not found');
      return;
    }
    if (acceptance.creatorId !== userId) {
      deleteUploadedFile(uploadedFile);
      err(res, req, 403, ErrorCode.FORBIDDEN, 'Not authorized for this Acceptance');
      return;
    }
    if (acceptance.status !== 'ACTIVE') {
      deleteUploadedFile(uploadedFile);
      err(res, req, 409, ErrorCode.INVALID_SUBMISSION_STATE, 'Acceptance is not open for a new Submission');
      return;
    }

    const latestSubmission = db.getLatestSubmissionByAcceptance(acceptance.id);
    if (latestSubmission && !['AI_FAILED', 'PROCESSING_ERROR'].includes(latestSubmission.status)) {
      deleteUploadedFile(uploadedFile);
      err(res, req, 409, ErrorCode.INVALID_SUBMISSION_STATE, 'Acceptance already has an active Submission');
      return;
    }

    const bounty = db.getBounty(acceptance.bountyId);
    if (!bounty) {
      deleteUploadedFile(uploadedFile);
      err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found');
      return;
    }
    if (bounty.status !== 'OPEN') {
      deleteUploadedFile(uploadedFile);
      err(res, req, 409, ErrorCode.BOUNTY_NOT_OPEN, 'Bounty is no longer accepting submissions');
      return;
    }

    const submission = db.createSubmission({
      bountyId: acceptance.bountyId,
      creatorId: acceptance.creatorId,
      acceptanceId: acceptance.id,
      storagePath: uploadedFile.path,
      originalFilename: uploadedFile.originalname,
      mimeType: uploadedFile.mimetype,
      sizeBytes: uploadedFile.size,
      durationSeconds: null,
      status: 'QUEUED',
      failureCode: null,
      failureMessage: null,
      transcript: null,
      aiSummary: null,
      aiConfidence: null,
      deliverableChecks: [],
      submittedAt: null,
    });
    db.rememberSubmissionCreateIdempotency(userId, idempotencyKey, submission.id);

    ok(res, req, { submission: mapSubmissionSummary(submission) }, 202);
    void processSubmission(submission.id);
  } catch {
    deleteUploadedFile(uploadedFile);
    console.error('[submissions] Creation failed');
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to create submission');
  }
});

router.post('/:submissionId/upload-complete', authMiddleware, (req: Request, res: Response): void => {
  const { userId } = (req as any).user;
  const submission = db.getSubmission(req.params.submissionId as string);
  if (!submission) {
    err(res, req, 404, ErrorCode.NOT_FOUND, 'Submission not found');
    return;
  }
  if (submission.creatorId !== userId) {
    err(res, req, 403, ErrorCode.FORBIDDEN, 'Not authorized for this Submission');
    return;
  }
  const acceptance = db.getAcceptanceById(submission.acceptanceId);
  if (!acceptance || acceptance.creatorId !== userId) {
    err(res, req, 403, ErrorCode.FORBIDDEN, 'Not authorized for this Acceptance');
    return;
  }
  if (!['CREATED', 'UPLOADING'].includes(submission.status)) {
    err(res, req, 409, ErrorCode.INVALID_SUBMISSION_STATE, 'Submission is not awaiting upload completion');
    return;
  }
  err(res, req, 409, ErrorCode.INVALID_SUBMISSION_STATE, 'TUS upload is not available locally; post replacement media through multipart POST /v1/submissions');
});

function getOwnedSubmission(req: Request, res: Response) {
  const submission = db.getSubmission(req.params.submissionId as string);
  if (!submission) {
    err(res, req, 404, ErrorCode.NOT_FOUND, 'Submission not found');
    return null;
  }
  if (submission.creatorId !== (req as any).user.userId) {
    err(res, req, 403, ErrorCode.FORBIDDEN, 'Not authorized for this Submission');
    return null;
  }
  return submission;
}

router.get('/:submissionId', authMiddleware, (req: Request, res: Response): void => {
  const submission = getOwnedSubmission(req, res);
  if (submission) ok(res, req, mapSubmissionSummary(submission));
});

router.get('/:submissionId/status', authMiddleware, (req: Request, res: Response): void => {
  const submission = getOwnedSubmission(req, res);
  if (submission) ok(res, req, mapSubmissionSummary(submission));
});

router.post('/:submissionId/retry', authMiddleware, (req: Request, res: Response): void => {
  const submission = getOwnedSubmission(req, res);
  if (!submission) return;
  if (!['AI_FAILED', 'PROCESSING_ERROR'].includes(submission.status)) {
    err(res, req, 409, ErrorCode.PROCESSING_RETRY_NOT_ALLOWED, 'Replacement media is only allowed for a failed Submission');
    return;
  }
  const acceptance = db.getAcceptanceById(submission.acceptanceId);
  if (!acceptance || acceptance.creatorId !== (req as any).user.userId || acceptance.status !== 'ACTIVE') {
    err(res, req, 409, ErrorCode.INVALID_SUBMISSION_STATE, 'Acceptance is not open for replacement media');
    return;
  }
  err(res, req, 409, ErrorCode.PROCESSING_RETRY_NOT_ALLOWED, 'Post replacement media through multipart POST /v1/submissions with this acceptanceId');
});

export default router;
