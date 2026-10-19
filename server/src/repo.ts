import { randomUUID } from 'node:crypto';
import type { AnalyticsEvent } from '../../shared/analytics';
import type { ItemStates, LeaderboardEntry, User } from '../../shared/api';
import type { Box } from '../../shared/srs';
import { initialProgress, type Progress } from '../../src/lib/progress';
import type { Db } from './db';

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  created_at: string;
}

export interface StoredUser extends User {
  passwordHash: string;
}

const toUser = (r: UserRow): StoredUser => ({
  id: r.id,
  email: r.email,
  displayName: r.display_name,
  createdAt: r.created_at,
  passwordHash: r.password_hash,
});

export const publicUser = ({ id, email, displayName, createdAt }: StoredUser): User => ({
  id,
  email,
  displayName,
  createdAt,
});

interface SrsRow {
  item_key: string;
  box: number;
  due: string;
  seen: number;
  wrong: number;
  last: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Data access for the API, kept in one place so routes stay small. */
export function createRepo(db: Db) {
  const q = {
    userById: db.prepare('SELECT * FROM users WHERE id = ?'),
    userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    insertUser: db.prepare(
      'INSERT INTO users (id, email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
    ),
    deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
    getProgress: db.prepare('SELECT json FROM progress WHERE user_id = ?'),
    upsertProgress: db.prepare(
      `INSERT INTO progress (user_id, json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
    ),
    insertXp: db.prepare('INSERT INTO xp_events (user_id, xp, created_at) VALUES (?, ?, ?)'),
    leaderboard: db.prepare(
      `SELECT u.id AS id, u.display_name AS displayName, SUM(e.xp) AS weeklyXp, MAX(e.created_at) AS lastAt
       FROM xp_events e JOIN users u ON u.id = e.user_id
       WHERE e.created_at >= ?
       GROUP BY u.id
       HAVING weeklyXp > 0
       ORDER BY weeklyXp DESC, lastAt ASC
       LIMIT ?`,
    ),
    getSrs: db.prepare('SELECT item_key, box, due, seen, wrong, last FROM srs_state WHERE user_id = ?'),
    deleteSrs: db.prepare('DELETE FROM srs_state WHERE user_id = ?'),
    upsertSrs: db.prepare(
      `INSERT INTO srs_state (user_id, item_key, box, due, seen, wrong, last) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, item_key) DO UPDATE SET
         box = excluded.box, due = excluded.due, seen = excluded.seen, wrong = excluded.wrong, last = excluded.last`,
    ),
    insertEvent: db.prepare(
      `INSERT INTO events (anon_id, user_id, name, lesson_id, item_key, ex_type, correct, first_try, duration_ms,
         props, client_ts, local_date, local_hour, app_version, platform, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ),
  };

  const bool = (v: boolean | undefined) => (v === undefined ? null : v ? 1 : 0);

  function transaction(fn: () => void): void {
    db.exec('BEGIN');
    try {
      fn();
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  return {
    findUserById(id: string): StoredUser | undefined {
      const row = q.userById.get(id) as UserRow | undefined;
      return row && toUser(row);
    },
    findUserByEmail(email: string): StoredUser | undefined {
      const row = q.userByEmail.get(email) as UserRow | undefined;
      return row && toUser(row);
    },
    /** Creates the user with fresh progress; returns undefined if the email is taken. */
    createUser(email: string, displayName: string, passwordHash: string, now = Date.now()): StoredUser | undefined {
      const id = randomUUID();
      const createdAt = new Date(now).toISOString();
      db.exec('BEGIN');
      try {
        q.insertUser.run(id, email, displayName, passwordHash, createdAt);
        q.upsertProgress.run(id, JSON.stringify(initialProgress(now)), now);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        if (String((err as Error).message).includes('UNIQUE')) return undefined;
        throw err;
      }
      return { id, email, displayName, createdAt, passwordHash };
    },
    /** Deletes the user; progress, XP, review state and events go with it (ON DELETE CASCADE). */
    deleteUser(id: string): void {
      q.deleteUser.run(id);
    },
    getProgress(userId: string, now = Date.now()): Progress {
      const row = q.getProgress.get(userId) as { json: string } | undefined;
      return row ? (JSON.parse(row.json) as Progress) : initialProgress(now);
    },
    saveProgress(userId: string, progress: Progress, now = Date.now()): void {
      q.upsertProgress.run(userId, JSON.stringify(progress), now);
    },
    /** Saves progress and records earned XP atomically. */
    saveLessonResult(userId: string, progress: Progress, xp: number, now = Date.now()): void {
      db.exec('BEGIN');
      try {
        q.upsertProgress.run(userId, JSON.stringify(progress), now);
        if (xp > 0) q.insertXp.run(userId, xp, now);
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    /** The learner's full spaced-repetition state. */
    getSrs(userId: string): ItemStates {
      const items: ItemStates = {};
      for (const r of q.getSrs.all(userId) as unknown as SrsRow[]) {
        items[r.item_key] = {
          box: Number(r.box) as Box,
          due: r.due,
          seen: Number(r.seen),
          wrong: Number(r.wrong),
          last: Number(r.last),
        };
      }
      return items;
    },
    /** Writes changed spaced-repetition items in one transaction. */
    /** Forgets the learner's whole review state (progress reset). */
    deleteSrs(userId: string): void {
      q.deleteSrs.run(userId);
    },
    saveSrs(userId: string, changed: ItemStates): void {
      transaction(() => {
        for (const [key, s] of Object.entries(changed)) {
          q.upsertSrs.run(userId, key, s.box, s.due, s.seen, s.wrong, s.last);
        }
      });
    },
    /** Stores validated analytics events; `userId` comes from the token, never the body. */
    insertEvents(events: AnalyticsEvent[], userId: string | null, now = Date.now()): void {
      transaction(() => {
        for (const e of events) {
          q.insertEvent.run(
            e.anonId,
            userId,
            e.name,
            e.lessonId ?? null,
            e.itemKey ?? null,
            e.exType ?? null,
            bool(e.correct),
            bool(e.firstTry),
            e.durationMs ?? null,
            JSON.stringify(e.props ?? {}),
            e.ts,
            e.localDate,
            e.localHour,
            e.appVersion,
            e.platform,
            now,
          );
        }
      });
    },
    leaderboard(meId: string | undefined, now = Date.now(), limit = 20): LeaderboardEntry[] {
      const rows = q.leaderboard.all(now - WEEK_MS, limit) as { id: string; displayName: string; weeklyXp: number }[];
      return rows.map((r, i) => ({
        rank: i + 1,
        displayName: r.displayName,
        weeklyXp: Number(r.weeklyXp),
        isMe: r.id === meId,
      }));
    },
  };
}

export type Repo = ReturnType<typeof createRepo>;
