import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { allLessons } from '../data/course';
import { ApiRequestError } from './api-error';
import { cloudError, createCloudApi } from './cloud';
import { completeLesson, initialProgress, type Progress } from './progress';

/** In-memory stand-in for the parts of supabase-js that cloud.ts uses. */
function fakeSupabase(opts: { signedIn?: boolean; confirmEmail?: boolean; stored?: Progress } = {}) {
  const db = {
    progress: opts.stored ? [{ user_id: 'u1', data: opts.stored }] : ([] as { user_id: string; data: unknown }[]),
    xp_events: [] as { user_id: string; xp: number }[],
    profiles: [{ id: 'u1', display_name: 'דנה' }],
  };
  let session = opts.signedIn ? { user: { id: 'u1' } } : null;
  const signUps: { options?: { emailRedirectTo?: string } }[] = [];
  const user = { id: 'u1', email: 'dana@example.com', created_at: '2026-01-01T00:00:00Z', user_metadata: {} };
  const client = {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      signUp: async (req: { options?: { emailRedirectTo?: string } }) =>
        signUps.push(req) && opts.confirmEmail
          ? { data: { user: { ...user, identities: [{}] }, session: null }, error: null }
          : ((session = { user: { id: 'u1' } }), { data: { user, session }, error: null }),
      signInWithPassword: async ({ password }: { password: string }) =>
        password === 'correct-horse'
          ? ((session = { user: { id: 'u1' } }), { data: { user, session }, error: null })
          : { data: { user: null, session: null }, error: { message: 'Invalid login credentials', status: 400 } },
      signOut: async () => ((session = null), { error: null }),
    },
    from: (table: keyof typeof db) => ({
      select: () => ({
        eq: (_col: string, value: string) => ({
          maybeSingle: async () => ({
            data: (db[table] as Record<string, unknown>[]).find((r) => r.user_id === value || r.id === value) ?? null,
            error: null,
          }),
        }),
      }),
      upsert: async (row: { user_id: string; data: unknown }) => {
        db.progress = [...db.progress.filter((r) => r.user_id !== row.user_id), row];
        return { error: null };
      },
      insert: async (row: { user_id: string; xp: number }) => {
        db.xp_events.push(row);
        return { error: null };
      },
    }),
    rpc: async () => ({
      data: [{ rank: 1, display_name: 'דנה', weekly_xp: '25', is_me: true }],
      error: null,
    }),
  };
  return { db, signUps, api: createCloudApi(async () => client as unknown as SupabaseClient) };
}

const [first, second] = allLessons;

describe('cloud backend', () => {
  it('registers and returns the display name from the profile', async () => {
    const { api } = fakeSupabase();
    const res = await api.register({ email: 'dana@example.com', password: 'correct-horse', displayName: 'דנה' });
    expect(res.user).toMatchObject({ id: 'u1', email: 'dana@example.com', displayName: 'דנה' });
  });

  it('asks to confirm the email when sign-up returns no session', async () => {
    const { api } = fakeSupabase({ confirmEmail: true });
    await expect(
      api.register({ email: 'a@b.co', password: 'correct-horse', displayName: 'דנה' }),
    ).rejects.toMatchObject({
      code: 'confirm_email',
    });
  });

  it('sends the confirmation link back to the public site', async () => {
    const { api, signUps } = fakeSupabase({ confirmEmail: true });
    await api.register({ email: 'a@b.co', password: 'correct-horse', displayName: 'דנה' }).catch(() => undefined);
    expect(signUps[0].options?.emailRedirectTo).toBe('https://rikigrossman.github.io/Spourt-English/');
  });

  it('rejects a wrong password with a Hebrew 401', async () => {
    const { api } = fakeSupabase();
    const err = await api.login({ email: 'dana@example.com', password: 'nope' }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.status).toBe(401);
    expect(err.message).toMatch(/שגויים/);
  });

  it('requires a session for progress calls', async () => {
    const { api } = fakeSupabase();
    const err = await api.putProgress(initialProgress()).catch((e) => e);
    expect(err.unauthorized).toBe(true);
  });

  it('merges uploaded progress and records the XP gained for the league', async () => {
    const { api, db } = fakeSupabase({ signedIn: true });
    const local = completeLesson(initialProgress(), first.id, 15);
    const res = await api.putProgress(local);
    expect(res.progress.completed[first.id]).toBe(1);
    expect(res.progress.xp).toBe(15);
    expect(db.xp_events).toEqual([{ user_id: 'u1', xp: 15 }]);
    // A second identical upload gains nothing.
    await api.putProgress(local);
    expect(db.xp_events).toHaveLength(1);
  });

  it('records a completed lesson and refuses a locked one', async () => {
    const { api, db } = fakeSupabase({ signedIn: true });
    await expect(api.completeLesson(second.id, { xp: 10, accuracy: 100 })).rejects.toMatchObject({
      code: 'lesson_locked',
    });
    const res = await api.completeLesson(first.id, { xp: 999, accuracy: 100 });
    expect(res.progress.completed[first.id]).toBe(1);
    // XP is clamped like the Express server does.
    expect(db.xp_events).toEqual([{ user_id: 'u1', xp: 50 }]);
  });

  it('maps the leaderboard rows', async () => {
    const { api } = fakeSupabase({ signedIn: true });
    expect((await api.leaderboard()).entries).toEqual([{ rank: 1, displayName: 'דנה', weeklyXp: 25, isMe: true }]);
  });
});

describe('cloudError', () => {
  it('treats network failures as offline', () => {
    expect(cloudError({ message: 'Failed to fetch' }).offline).toBe(true);
  });

  it('recognises a taken email', () => {
    expect(cloudError({ code: 'user_already_exists' }).status).toBe(409);
  });
});
