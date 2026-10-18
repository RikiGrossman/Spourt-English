import { allLessons } from '../../src/data/course';
import { MAX_HEARTS, dateKey, refresh, shiftDateKey, type Progress } from '../../src/lib/progress';

export const MAX_TOTAL_XP = 10_000_000;
const MAX_COUNT = 100_000;
const lessonIds = new Set(allLessons.map((l) => l.id));

const isNonNegNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const clampInt = (v: number, max: number) => Math.min(max, Math.floor(v));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A client-reported local date, if plausible: a real calendar date within one
 * day of the server's date (learners' time zones differ from the server's by
 * less than a day). Returns null otherwise.
 */
export function plausibleLocalDate(value: unknown, now = Date.now()): string | null {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  if (shiftDateKey(value, 0) !== value) return null; // e.g. 2026-02-31
  const today = dateKey(now);
  return value >= shiftDateKey(today, -1) && value <= shiftDateKey(today, 1) ? value : null;
}

/**
 * Validates an untrusted Progress (e.g. from PUT /api/progress) and clamps it
 * to sane values. Unknown lesson ids are dropped. Returns null if malformed.
 */
export function sanitizeProgress(input: unknown, now = Date.now()): Progress | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const p = input as Record<string, unknown>;
  const { xp, completed, streak, lastActiveDate, xpToday, hearts, heartsUpdatedAt } = p;
  if (!isNonNegNumber(xp) || !isNonNegNumber(streak) || !isNonNegNumber(xpToday)) return null;
  if (!isNonNegNumber(hearts) || !isNonNegNumber(heartsUpdatedAt)) return null;
  if (lastActiveDate !== null && (typeof lastActiveDate !== 'string' || !DATE_RE.test(lastActiveDate))) {
    return null;
  }
  // A date in the future (wrong device clock, tampering) would win every later merge
  // and freeze the streak, so the day fields of such an upload are dropped.
  const future = lastActiveDate !== null && lastActiveDate > shiftDateKey(dateKey(now), 1);
  if (!completed || typeof completed !== 'object' || Array.isArray(completed)) return null;
  const cleanCompleted: Record<string, number> = {};
  for (const [id, count] of Object.entries(completed)) {
    if (!isNonNegNumber(count)) return null;
    if (lessonIds.has(id) && count >= 1) cleanCompleted[id] = clampInt(count, MAX_COUNT);
  }
  return {
    xp: clampInt(xp, MAX_TOTAL_XP),
    completed: cleanCompleted,
    streak: future ? 0 : clampInt(streak, MAX_COUNT),
    lastActiveDate: future ? null : lastActiveDate,
    xpToday: future ? 0 : clampInt(xpToday, MAX_TOTAL_XP),
    hearts: clampInt(hearts, MAX_HEARTS),
    heartsUpdatedAt: Math.min(heartsUpdatedAt, now),
  };
}

/**
 * Merges stored and uploaded progress (rules from shared/api.ts):
 * - xp: the maximum;
 * - completed: union of lessons, keeping the higher count;
 * - lastActiveDate: the later one, together with its streak and xpToday
 *   (same date → the higher of each);
 * - hearts: after applying refills to both, the lower count with its clock
 *   (conservative, so syncing can't refill hearts).
 */
export function mergeProgress(stored: Progress, incoming: Progress, now = Date.now()): Progress {
  const a = refresh(stored, now);
  const b = refresh(incoming, now);

  const completed: Record<string, number> = { ...a.completed };
  for (const [id, count] of Object.entries(b.completed)) {
    completed[id] = Math.max(completed[id] ?? 0, count);
  }

  const da = a.lastActiveDate ?? '';
  const dbb = b.lastActiveDate ?? '';
  let streak: number;
  let xpToday: number;
  let lastActiveDate: string | null;
  if (da === dbb) {
    lastActiveDate = a.lastActiveDate;
    streak = Math.max(a.streak, b.streak);
    xpToday = Math.max(a.xpToday, b.xpToday);
  } else {
    const later = da > dbb ? a : b;
    ({ lastActiveDate, streak, xpToday } = later);
  }

  let hearts = a.hearts;
  let heartsUpdatedAt = a.heartsUpdatedAt;
  if (b.hearts < a.hearts || (b.hearts === a.hearts && b.heartsUpdatedAt > a.heartsUpdatedAt)) {
    hearts = b.hearts;
    heartsUpdatedAt = b.heartsUpdatedAt;
  }

  return {
    xp: Math.max(a.xp, b.xp),
    completed,
    streak,
    lastActiveDate,
    xpToday,
    hearts,
    heartsUpdatedAt,
  };
}
