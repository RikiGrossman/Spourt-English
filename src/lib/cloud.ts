import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AuthResponse,
  CompleteLessonRequest,
  LeaderboardResponse,
  LoginRequest,
  ProgressResponse,
  RegisterRequest,
  User,
} from '../../shared/api';
import { MAX_LESSON_XP, mergeProgress, plausibleLocalDate, sanitizeProgress } from '../../shared/progress-merge';
import { findLesson } from '../data/course';
import { completeLesson, dateKey, initialProgress, isUnlocked, type Progress } from './progress';
import { ApiRequestError, OFFLINE_MESSAGE } from './api-error';
import { authRedirectUrl } from './config';

/**
 * The same operations as the REST client in api.ts, backed by Supabase (auth + Postgres,
 * schema in supabase/schema.sql). The rules the Express server enforces run here on the
 * client; row-level security keeps each learner to their own rows.
 */

/** Marker kept in StoredAuth – supabase-js stores and refreshes the real session itself. */
export const CLOUD_TOKEN = 'supabase';

const NOT_SIGNED_IN = 'צריך להתחבר כדי לעשות את זה.';

/** Maps Supabase/network failures to ApiRequestError with a Hebrew message. */
export function cloudError(
  error: { message?: string; status?: number; code?: string } | null | undefined,
): ApiRequestError {
  const message = error?.message ?? '';
  const code = error?.code ?? '';
  if (/fetch|network|Load failed/i.test(message)) return new ApiRequestError(0, 'network', OFFLINE_MESSAGE);
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return new ApiRequestError(401, 'invalid_credentials', 'האימייל או הסיסמה שגויים.');
  }
  if (code === 'user_already_exists' || /already registered/i.test(message)) {
    return new ApiRequestError(409, 'email_taken', 'כבר קיים חשבון עם האימייל הזה. נסו להתחבר.');
  }
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) {
    return new ApiRequestError(403, 'email_not_confirmed', 'צריך לאשר את כתובת האימייל – בדקו את תיבת הדואר.');
  }
  if (code === 'weak_password' || /password/i.test(message)) {
    return new ApiRequestError(400, 'weak_password', 'הסיסמה חלשה מדי. בחרו סיסמה ארוכה יותר.');
  }
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || error?.status === 429) {
    return new ApiRequestError(429, 'rate_limited', 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.');
  }
  return new ApiRequestError(error?.status && error.status < 500 ? error.status : 0, code || 'cloud', OFFLINE_MESSAGE);
}

export function createCloudApi(getClient: () => Promise<SupabaseClient>) {
  async function userId(client: SupabaseClient): Promise<string> {
    const { data, error } = await client.auth.getSession();
    if (error) throw cloudError(error);
    const id = data.session?.user.id;
    if (!id) throw new ApiRequestError(401, 'unauthorized', NOT_SIGNED_IN);
    return id;
  }

  async function loadProgress(client: SupabaseClient, id: string, now: number): Promise<Progress> {
    const { data, error } = await client.from('progress').select('data').eq('user_id', id).maybeSingle();
    if (error) throw cloudError(error);
    return (data && sanitizeProgress(data.data, now)) || initialProgress(now);
  }

  async function save(client: SupabaseClient, id: string, progress: Progress, xp: number) {
    const { error } = await client
      .from('progress')
      .upsert({ user_id: id, data: progress, updated_at: new Date().toISOString() });
    if (error) throw cloudError(error);
    if (xp > 0) {
      const { error: xpError } = await client.from('xp_events').insert({ user_id: id, xp });
      if (xpError) throw cloudError(xpError);
    }
  }

  async function toAuthResponse(
    client: SupabaseClient,
    user: { id: string; email?: string; created_at: string; user_metadata?: Record<string, unknown> },
  ): Promise<AuthResponse> {
    const { data } = await client.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
    const fromMeta = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : '';
    const result: User = {
      id: user.id,
      email: user.email ?? '',
      displayName: data?.display_name ?? fromMeta,
      createdAt: user.created_at,
    };
    return { token: CLOUD_TOKEN, user: result };
  }

  return {
    async register(req: RegisterRequest): Promise<AuthResponse> {
      const client = await getClient();
      const { data, error } = await client.auth.signUp({
        email: req.email,
        password: req.password,
        options: { data: { display_name: req.displayName }, emailRedirectTo: authRedirectUrl() },
      });
      if (error) throw cloudError(error);
      // With "Confirm email" on, Supabase returns no session until the link is clicked;
      // an already-registered address also comes back this way (with no identities).
      if (!data.session || !data.user) {
        if (data.user && data.user.identities?.length === 0) throw cloudError({ code: 'user_already_exists' });
        throw new ApiRequestError(
          202,
          'confirm_email',
          'שלחנו אליך מייל לאישור החשבון. אחרי שתלחצו על הקישור, חזרו לכאן והתחברו.',
        );
      }
      return toAuthResponse(client, data.user);
    },

    async login(req: LoginRequest): Promise<AuthResponse> {
      const client = await getClient();
      const { data, error } = await client.auth.signInWithPassword({ email: req.email, password: req.password });
      if (error) throw cloudError(error);
      return toAuthResponse(client, data.user);
    },

    async signOut(): Promise<void> {
      const client = await getClient();
      await client.auth.signOut().catch(() => undefined);
    },

    /** Merges uploaded progress with the stored copy (same rules as PUT /api/progress). */
    async putProgress(progress: Progress): Promise<ProgressResponse> {
      const client = await getClient();
      const id = await userId(client);
      const now = Date.now();
      const incoming = sanitizeProgress(progress, now);
      if (!incoming) throw new ApiRequestError(400, 'invalid_progress', 'נתוני ההתקדמות אינם תקינים');
      const stored = await loadProgress(client, id, now);
      const merged = mergeProgress(stored, incoming, now);
      // XP that never went through completeLesson (practice, offline lessons) counts for the
      // league too, capped per sync like a single lesson.
      await save(client, id, merged, Math.max(0, Math.min(MAX_LESSON_XP, merged.xp - stored.xp)));
      return { progress: merged };
    },

    /** Records a finished lesson (same checks as POST /api/lessons/:id/complete). */
    async completeLesson(lessonId: string, req: CompleteLessonRequest): Promise<ProgressResponse> {
      if (!findLesson(lessonId)) throw new ApiRequestError(404, 'lesson_not_found', 'השיעור לא נמצא');
      const client = await getClient();
      const id = await userId(client);
      const now = Date.now();
      const current = await loadProgress(client, id, now);
      if (!isUnlocked(current, lessonId)) {
        throw new ApiRequestError(403, 'lesson_locked', 'השיעור הזה עדיין נעול – סיימו קודם את השיעור הקודם');
      }
      const xp = Math.max(0, Math.min(MAX_LESSON_XP, Math.round(req.xp)));
      const today = plausibleLocalDate(req.date, now) ?? dateKey(now);
      const progress = completeLesson(current, lessonId, xp, now, today);
      await save(client, id, progress, xp);
      return { progress };
    },

    async leaderboard(): Promise<LeaderboardResponse> {
      const client = await getClient();
      const { data, error } = await client.rpc('weekly_leaderboard');
      if (error) throw cloudError(error);
      const rows = (data ?? []) as { rank: number; display_name: string; weekly_xp: number; is_me: boolean }[];
      return {
        entries: rows.map((r) => ({
          rank: r.rank,
          displayName: r.display_name,
          weeklyXp: Number(r.weekly_xp),
          isMe: r.is_me,
        })),
      };
    },
  };
}
