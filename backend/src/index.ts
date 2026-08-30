import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { requestIdMiddleware } from './middleware/auth';
import acceptancesRouter from './routes/acceptances';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import bountiesRouter from './routes/bounties';
import ledgerRouter from './routes/ledger';
import reviewRouter from './routes/review';
import submissionsRouter from './routes/submissions';
import { err, ErrorCode, ok } from './shared/response';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);

const uploadsDir = path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('/health/live', (req, res) => ok(res, req, { status: 'alive' }));
app.get('/health/ready', (req, res) => ok(res, req, { status: 'ready', mode: 'in-memory' }));
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ClapBack API',
    version: '1.0.0-hackathon',
    timestamp: new Date().toISOString(),
  });
});

app.use('/v1', authRouter);
app.use('/v1/bounties', bountiesRouter);
app.use('/v1/acceptances', acceptancesRouter);
app.use('/v1/submissions', submissionsRouter);
app.use('/v1/review', reviewRouter);
app.use('/v1/admin', adminRouter);
app.use('/v1/ledger', ledgerRouter);

app.use('/api/bounties', bountiesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/ledger', ledgerRouter);

app.use((req, res) => {
  err(res, req, 404, ErrorCode.NOT_FOUND, `Cannot ${req.method} ${req.path}`);
});

app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Uncaught request error');
  err(res, req, 500, ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
});

app.listen(PORT, () => {
  console.log(`ClapBack API running on http://localhost:${PORT}`);
});

export default app;
