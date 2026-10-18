/**
 * HTTP contract between the web app (src/) and the server (server/).
 * Both sides import these types – change them only in coordination.
 *
 * All endpoints live under `/api`, exchange JSON, and authenticate with
 * `Authorization: Bearer <token>` where noted. Errors use `ApiError` with a
 * non-2xx status.
 */
import type { Progress } from '../src/lib/progress';

export type { Progress };

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface ApiError {
  error: string;
  /** Hebrew message that can be shown to the learner as-is. */
  message: string;
}

/** POST /api/auth/register */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

/** POST /api/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Response of register and login. */
export interface AuthResponse {
  token: string;
  user: User;
}

/** GET /api/me (auth) */
export interface MeResponse {
  user: User;
  progress: Progress;
}

/**
 * PUT /api/progress (auth) – uploads local progress (e.g. after a guest signs up).
 * The server merges: max xp, union of completed lessons (max count),
 * the later lastActiveDate with its streak. Responds with the merged Progress.
 */
export type SyncProgressRequest = Progress;

/** POST /api/lessons/:lessonId/complete (auth) */
export interface CompleteLessonRequest {
  xp: number;
  accuracy: number;
  /**
   * Optional: the learner's local date (YYYY-MM-DD) when the lesson ended, so
   * streaks follow the device's calendar rather than the server's time zone.
   * Ignored unless it is within one day of the server's date.
   */
  date?: string;
}

/** Response of GET/PUT /api/progress and lesson completion. */
export interface ProgressResponse {
  progress: Progress;
}

/** GET /api/leaderboard – top learners by XP over the last 7 days. */
export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  weeklyXp: number;
  isMe: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

/** GET /api/health */
export interface HealthResponse {
  ok: true;
  version: string;
}
