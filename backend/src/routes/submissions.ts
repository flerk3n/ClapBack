import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, Submission } from '../db/memoryDb';
import { authMiddleware } from '../middleware/auth';
import { extractAudio, cleanupFile } from '../services/audioExtractor';
import { transcribeAudio } from '../services/elevenLabs';
import { verifyDeliverablesStructured } from '../services/llmVerifier';
import { runReviewerSimulation, REVIEWER_AVATARS } from '../services/reviewerSimulator';
import { ok, err, ErrorCode } from '../shared/response';

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'video/mp4' || file.originalname.toLowerCase().endsWith('.mp4')) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4 files are accepted'));
    }
  },
});

function mapSubmission(s: Submission) {
  return {
    id: s.id,
    bountyId: s.bountyId,
    creatorId: s.creatorId,
    acceptanceId: s.acceptanceId,
    originalFilename: s.originalFilename,
    mimeType: s.mimeType,
    sizeBytes: s.sizeBytes,
    durationSeconds: s.durationSeconds,
    status: s.status,
    failureCode: s.failureCode,
    failureMessage: s.failureMessage,
    transcript: s.transcript,
    aiSummary: s.aiSummary,
    aiConfidence: s.aiConfidence,
    deliverableChecks: s.deliverableChecks,
    createdAt: s.createdAt,
    submittedAt: s.submittedAt,
    updatedAt: s.updatedAt,
    reviewers: REVIEWER_AVATARS,
  };
}

/**
 * Async processing pipeline:
 * QUEUED -> TRANSCRIBING -> EVALUATING -> AI_PASSED / AI_FAILED
 */
async function processSubmission(submissionId: string) {
  const sub = db.getSubmission(submissionId);
  if (!sub) return;

  const bounty = db.getBounty(sub.bountyId);
  if (!bounty) return;

  const user = db.getUser(sub.creatorId);

  // Transition to TRANSCRIBING
  db.updateSubmission(submissionId, { status: 'TRANSCRIBING' });

  let audioPath: string | null = null;
  let transcriptText: string | null = null;

  try {
    // 1. Audio extraction (if local file exists)
    if (fs.existsSync(sub.storagePath)) {
      console.log(`[pipeline] ${submissionId} → Extracting audio from MP4...`);
      audioPath = await extractAudio(sub.storagePath);
    }

    // 2. Transcription via ElevenLabs
    console.log(`[pipeline] ${submissionId} → Transcribing audio...`);
    transcriptText = await transcribeAudio(audioPath);

    db.updateSubmission(submissionId, {
      transcript: transcriptText,
      status: 'EVALUATING',
    });

    // 3. Structured Deliverable verification
    console.log(`[pipeline] ${submissionId} → Evaluating deliverables with structured LLM...`);
    const evalResult = await verifyDeliverablesStructured(bounty.brief, bounty.deliverables, transcriptText);

    if (evalResult.passed) {
      console.log(`[pipeline] ${submissionId} → PASSED verification!`);
      db.updateSubmission(submissionId, {
        status: 'AI_PASSED',
        aiSummary: evalResult.aiSummary,
        aiConfidence: evalResult.aiConfidence,
        deliverableChecks: evalResult.checks,
        failureCode: null,
        failureMessage: null,
        submittedAt: new Date().toISOString(),
      });

      // Update acceptance
      db.updateAcceptance(sub.acceptanceId, { status: 'SUBMITTED' });

      // Run reviewer simulation for live demo feedback
      if (user) {
        const payout = db.computeCreatorPayout(bounty, user.clapScore);
        runReviewerSimulation(submissionId, sub.creatorId, bounty.productName, payout);
      }
    } else {
      console.log(`[pipeline] ${submissionId} → FAILED verification: ${evalResult.failureMessage}`);
      db.updateSubmission(submissionId, {
        status: 'AI_FAILED',
        aiSummary: evalResult.aiSummary,
        aiConfidence: evalResult.aiConfidence,
        deliverableChecks: evalResult.checks,
        failureCode: 'DELIVERABLES_NOT_MET',
        failureMessage: evalResult.failureMessage ?? 'Video failed required deliverable checks.',
      });

      // Deduct minor trust score on failed submission
      if (user) {
        db.updateUser(user.id, { trustScore: Math.max(0, user.trustScore - 5) });
      }
    }
  } catch (err: any) {
    console.error(`[pipeline] ${submissionId} → Processing error:`, err);
    db.updateSubmission(submissionId, {
      status: 'PROCESSING_ERROR',
      failureCode: 'INTERNAL_ERROR',
      failureMessage: err?.message || 'Video processing encountered a temporary error.',
    });
  } finally {
    if (audioPath) cleanupFile(audioPath);
  }
}

/**
 * POST /v1/submissions
 * Supports multipart video upload or JSON initiation.
 */
router.post(
  '/',
  authMiddleware,
  upload.single('video'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = (req as any).user;
      const bountyId = req.body.bountyId || req.body.bounty_id;
      let acceptanceId = req.body.acceptanceId;

      if (!bountyId) {
        err(res, req, 400, ErrorCode.VALIDATION_ERROR, 'bountyId is required');
        return;
      }

      const bounty = db.getBounty(bountyId);
      if (!bounty) {
        err(res, req, 404, ErrorCode.BOUNTY_NOT_FOUND, 'Bounty not found');
        return;
      }

      // Check or create acceptance
      let acceptance = acceptanceId ? db.getAcceptanceById(acceptanceId) : db.findAcceptance(userId, bountyId);
      if (!acceptance) {
        acceptance = db.createAcceptance(userId, bountyId, bounty.deadlineHours);
      }
      acceptanceId = acceptance.id;

      if (!req.file) {
        // TUS / signed descriptor mode
        const storagePath = `submissions/${bountyId}/${userId}/${Date.now()}.mp4`;
        const sub = db.createSubmission({
          bountyId,
          creatorId: userId,
          acceptanceId,
          storagePath,
          originalFilename: req.body.filename || 'video.mp4',
          mimeType: req.body.mimeType || 'video/mp4',
          sizeBytes: Number(req.body.sizeBytes) || 0,
          durationSeconds: null,
          status: 'CREATED',
          failureCode: null,
          failureMessage: null,
          transcript: null,
          aiSummary: null,
          aiConfidence: null,
          deliverableChecks: [],
          submittedAt: null,
        });

        ok(res, req, {
          submission: mapSubmission(sub),
          upload: {
            protocol: 'TUS',
            endpoint: `/v1/submissions/${sub.id}/upload-complete`,
            headers: { 'Content-Type': 'application/offset+octet-stream' },
            storagePath,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            maxSizeBytes: 100 * 1024 * 1024,
          },
        }, 201);
        return;
      }

      // Direct file upload mode (multipart)
      const sub = db.createSubmission({
        bountyId,
        creatorId: userId,
        acceptanceId,
        storagePath: req.file.path,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
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

      // Respond immediately with submission summary
      ok(res, req, {
        submission: mapSubmission(sub),
        submission_id: sub.id, // For backward compatibility with initial mobile client
      }, 202);

      // Trigger background processing
      processSubmission(sub.id).catch(e => console.error('[submissions] Background process error:', e));
    } catch (e) {
      console.error('[submissions] POST / error:', e);
      err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to create submission');
    }
  }
);

/**
 * POST /v1/submissions/:submissionId/upload-complete
 * Marks upload complete and starts verification.
 */
router.post('/:submissionId/upload-complete', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as any).user;
    const sub = db.getSubmission(req.params.submissionId as string);

    if (!sub) {
      err(res, req, 404, ErrorCode.NOT_FOUND, 'Submission not found');
      return;
    }
    if (sub.creatorId !== userId) {
      err(res, req, 403, ErrorCode.FORBIDDEN, 'Not authorized for this submission');
      return;
    }

    const updated = db.updateSubmission(sub.id, {
      status: 'QUEUED',
      sizeBytes: Number(req.body.sizeBytes) || sub.sizeBytes,
    });

    ok(res, req, mapSubmission(updated!));

    // Kick off pipeline
    processSubmission(sub.id).catch(e => console.error('[submissions] upload-complete pipeline error:', e));
  } catch (e) {
    console.error('[submissions] upload-complete error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to complete upload');
  }
});

/**
 * GET /v1/submissions/:submissionId
 * Returns canonical submission status.
 */
router.get('/:submissionId', authMiddleware, (req: Request, res: Response): void => {
  try {
    const sub = db.getSubmission(req.params.submissionId as string);
    if (!sub) {
      err(res, req, 404, ErrorCode.NOT_FOUND, 'Submission not found');
      return;
    }

    ok(res, req, mapSubmission(sub));
  } catch (e) {
    console.error('[submissions] GET /:id error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch submission');
  }
});

/**
 * GET /v1/submissions/:submissionId/status
 * Backward-compatible endpoint for mobile polling.
 */
router.get('/:submissionId/status', authMiddleware, (req: Request, res: Response): void => {
  try {
    const sub = db.getSubmission(req.params.submissionId as string);
    if (!sub) {
      err(res, req, 404, ErrorCode.NOT_FOUND, 'Submission not found');
      return;
    }

    // Map canonical status to mobile UI status
    let aiStatus = 'processing';
    if (sub.status === 'AI_PASSED' || sub.status === 'IN_REVIEW') aiStatus = 'reviewer_queue';
    else if (sub.status === 'SCORED') aiStatus = 'brand_approved';
    else if (sub.status === 'AI_FAILED' || sub.status === 'PROCESSING_ERROR') aiStatus = 'failed';

    const checksPassed = sub.deliverableChecks.every(c => c.passed);
    const geminiVerdict = sub.status === 'AI_PASSED' || sub.status === 'SCORED' ? 'YES' : (sub.status === 'AI_FAILED' ? 'NO' : null);

    ok(res, req, {
      id: sub.id,
      status: sub.status,
      ai_status: aiStatus,
      transcript: sub.transcript,
      gemini_verdict: geminiVerdict,
      openai_verdict: geminiVerdict,
      final_rating: sub.status === 'SCORED' ? 4.8 : null,
      reviewer_ratings: sub.status === 'SCORED' ? [5, 4.5, 5, 4.8, 5] : [],
      reviewers: REVIEWER_AVATARS,
      failure_message: sub.failureMessage,
      deliverable_checks: sub.deliverableChecks,
      updated_at: sub.updatedAt,
    });
  } catch (e) {
    console.error('[submissions] GET /:id/status error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to fetch status');
  }
});

/**
 * POST /v1/submissions/:submissionId/retry
 * Retries a failed submission. Creates a new submission row for the same acceptance.
 */
router.post('/:submissionId/retry', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { userId } = (req as any).user;
    const oldSub = db.getSubmission(req.params.submissionId as string);

    if (!oldSub) {
      err(res, req, 404, ErrorCode.NOT_FOUND, 'Submission not found');
      return;
    }
    if (oldSub.creatorId !== userId) {
      err(res, req, 403, ErrorCode.FORBIDDEN, 'Not authorized');
      return;
    }
    if (oldSub.status !== 'AI_FAILED' && oldSub.status !== 'PROCESSING_ERROR') {
      err(res, req, 400, ErrorCode.PROCESSING_RETRY_NOT_ALLOWED, 'Retry only allowed for failed submissions');
      return;
    }

    const newSub = db.createSubmission({
      bountyId: oldSub.bountyId,
      creatorId: userId,
      acceptanceId: oldSub.acceptanceId,
      storagePath: `submissions/${oldSub.bountyId}/${userId}/${Date.now()}.mp4`,
      originalFilename: oldSub.originalFilename,
      mimeType: oldSub.mimeType,
      sizeBytes: 0,
      durationSeconds: null,
      status: 'CREATED',
      failureCode: null,
      failureMessage: null,
      transcript: null,
      aiSummary: null,
      aiConfidence: null,
      deliverableChecks: [],
      submittedAt: null,
    });

    ok(res, req, {
      submission: mapSubmission(newSub),
      upload: {
        protocol: 'TUS',
        endpoint: `/v1/submissions/${newSub.id}/upload-complete`,
        headers: { 'Content-Type': 'application/offset+octet-stream' },
        storagePath: newSub.storagePath,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        maxSizeBytes: 100 * 1024 * 1024,
      },
    }, 201);
  } catch (e) {
    console.error('[submissions] POST /:id/retry error:', e);
    err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'Failed to retry submission');
  }
});

export default router;
