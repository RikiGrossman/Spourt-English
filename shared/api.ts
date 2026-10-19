/**
 * HTTP contract between the web app (src/) and the server (server/).
 * Both sides import these types – change them only in coordination.
 *
 * All endpoints live under `/api`, exchange JSON, and authenticate with
 * `Authorization: Bearer <token>` where noted. Errors use `ApiError` with a
 * non-2xx status.
 */
import type { Progress } from '../src/lib/progress';
import type { ItemStates } from './srs';

export type { Progress };
export type { ItemState, ItemStates } from './srs';
export type { AnalyticsEvent, EventsRequest } from './analytics';
/** POST /api/call/turn (auth optional) – one turn of the AI video call, see shared/call.ts. */
export type { CallTurnRequest, CallTurnResponse } from './call';

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

/**
 * DELETE /api/me (auth) – deletes the account and everything stored with it (progress, XP,
 * review state, analytics events). The password is asked again so a borrowed, signed-in
 * device can't wipe someone's account. Responds 204.
 */
export interface DeleteAccountRequest {
  password: string;
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
  /** Optional (Could, v2): oldest client version that keeps unknown lesson ids safely. */
  minClientVersion?: string;
}

// ---- v2 additions (docs/spec/v2.md §6.4) ----

/** GET /api/srs (auth) – the learner's full spaced-repetition state. */
export interface SrsResponse {
  items: ItemStates;
}

/**
 * PUT /api/srs (auth) – uploads changed items only (a delta, ≤ MAX_ITEMS_PER_REQUEST).
 * The server sanitizes, merges per item (shared/srs-merge.ts) and responds with the full
 * merged state as SrsResponse.
 */
export interface PutSrsRequest {
  items: ItemStates;
}
