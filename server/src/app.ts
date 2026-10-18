import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import express, { type RequestHandler } from 'express';
import { authenticate, rateLimit, resolveSecret } from './auth';
import type { Db } from './db';
import { HttpError, errorHandler } from './errors';
import { createRepo } from './repo';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { leaderboardRouter } from './routes/leaderboard';
import { progressRouter } from './routes/progress';

export interface AppOptions {
  /** Defaults to resolveSecret() (JWT_SECRET env). */
  secret?: string;
  /** Requests per window on each auth endpoint, per IP. */
  authRateLimit?: { max: number; windowMs: number };
  /** Directory of the built web app to serve; defaults to ../dist in production. */
  staticDir?: string | false;
  /** Allow cross-origin requests from localhost (dev only by default). */
  cors?: boolean;
  /** Honour X-Forwarded-For (set when running behind a reverse proxy). */
  trustProxy?: boolean;
}

const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');
  next();
};

const devCors: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    if (req.method === 'OPTIONS') return void res.sendStatus(204);
  }
  next();
};

export function createApp(db: Db, options: AppOptions = {}) {
  const production = process.env.NODE_ENV === 'production';
  const secret = options.secret ?? resolveSecret();
  const repo = createRepo(db);
  const userExists = (id: string) => repo.findUserById(id) !== undefined;
  const requireAuth = authenticate(secret, userExists, true);
  const optionalAuth = authenticate(secret, userExists, false);
  const limiter = rateLimit(options.authRateLimit ?? { max: 20, windowMs: 15 * 60 * 1000 });

  const app = express();
  app.disable('x-powered-by');
  if (options.trustProxy ?? process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.use(securityHeaders);
  if (options.cors ?? !production) app.use('/api', devCors);

  const api = express.Router();
  api.use(express.json({ limit: '100kb' }));
  api.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  api.use(healthRouter());
  api.use(authRouter(repo, secret, limiter, requireAuth));
  api.use(progressRouter(repo, requireAuth));
  api.use(leaderboardRouter(repo, optionalAuth));
  api.use((_req, _res, next) => next(new HttpError(404, 'not_found', 'הנתיב המבוקש לא נמצא')));
  app.use('/api', api);

  const staticDir =
    options.staticDir ?? (production ? resolve(import.meta.dirname, '../../dist') : false);
  if (staticDir) {
    if (!existsSync(join(staticDir, 'index.html'))) {
      console.warn(`[server] ${staticDir}/index.html not found – run "npm run build" at the repo root`);
    }
    app.use(express.static(staticDir, { index: false, maxAge: '1h' }));
    // SPA fallback: any other GET outside /api gets the app shell.
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(join(staticDir, 'index.html'), (err) => err && next(err));
    });
  }

  app.use(errorHandler);
  return app;
}
