import { Router, type RequestHandler } from 'express';
import type { LeaderboardResponse } from '../../../shared/api';
import type { Repo } from '../repo';

export function leaderboardRouter(repo: Repo, optionalAuth: RequestHandler) {
  const router = Router();

  router.get('/leaderboard', optionalAuth, (_req, res) => {
    const body: LeaderboardResponse = { entries: repo.leaderboard(res.locals.userId) };
    res.json(body);
  });

  return router;
}
