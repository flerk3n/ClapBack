import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import { requestIdMiddleware } from './middleware/auth';
import { err, ok, ErrorCode } from './shared/response';

import authRouter from './routes/auth';
import bountiesRouter from './routes/bounties';
import submissionsRouter from './routes/submissions';
import reviewRouter from './routes/review';
import adminRouter from './routes/admin';
import ledgerRouter from './routes/ledger';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);

// Serve uploaded videos statically
const uploadsDir = path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? 'uploads');
app.use('/uploads', express.static(uploadsDir));

// ─── Health Checks (Phase B0) ─────────────────────────────────────────────────
app.get('/health/live', (req, res) => {
  ok(res, req, { status: 'alive' });
});

app.get('/health/ready', (req, res) => {
  ok(res, req, { status: 'ready', mode: 'in-memory' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ClapBack API',
    version: '1.0.0-hackathon',
    timestamp: new Date().toISOString(),
  });
});

// ─── Canonical /v1 Routes ─────────────────────────────────────────────────────
app.use('/v1/auth', authRouter);
app.use('/v1/demo/auth', authRouter);
app.use('/v1/bounties', bountiesRouter);
app.use('/v1/acceptances', bountiesRouter);
app.use('/v1/submissions', submissionsRouter);
app.use('/v1/review', reviewRouter);
app.use('/v1/admin', adminRouter);
app.use('/v1/ledger', ledgerRouter);

// Forward /v1/me to authRouter
app.get('/v1/me', (req, res, next) => {
  req.url = '/me';
  authRouter(req, res, next);
});
app.put('/v1/me/niches', (req, res, next) => {
  req.url = '/me/niches';
  authRouter(req, res, next);
});
app.get('/v1/niches', (req, res, next) => {
  req.url = '/niches';
  authRouter(req, res, next);
});

// ─── Backward-compatible /api Routes (for existing mobile clients) ─────────────
app.use('/api/auth', authRouter);
app.use('/api/bounties', bountiesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/ledger', ledgerRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  err(res, req, 404, ErrorCode.NOT_FOUND, `Cannot ${req.method} ${req.path}`);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Uncaught error:', error);
  err(res, req, 500, ErrorCode.INTERNAL_ERROR, error?.message || 'An unexpected error occurred');
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎬 ClapBack API running on http://localhost:${PORT}`);
  console.log(`   Canonical Base: http://localhost:${PORT}/v1`);
  console.log(`   Health Live:    http://localhost:${PORT}/health/live`);
  console.log(`   Health Ready:   http://localhost:${PORT}/health/ready`);
  console.log(`   Mode:           In-Memory DB\n`);
});

export default app;
