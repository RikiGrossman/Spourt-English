import { allLessons } from '../data/course';

export const MAX_HEARTS = 5;
export const HEART_REFILL_MS = 30 * 60 * 1000;
export const DAILY_GOAL_XP = 30;

export interface Progress {
  xp: number;
  /** Lesson id → number of times completed. */
  completed: Record<string, number>;
  streak: number;
  /** Local date (YYYY-MM-DD) of the last completed lesson. */
  lastActiveDate: string | null;
  xpToday: number;
  hearts: number;
  /** Timestamp the heart refill clock counts from. */
  heartsUpdatedAt: number;
  /** Daily XP goal chosen in onboarding. Missing in older saves – fall back to DAILY_GOAL_XP. */
  dailyGoal?: number;
}

export function initialProgress(now = Date.now()): Progress {
  return {
    xp: 0,
    completed: {},
    streak: 0,
    lastActiveDate: null,
    xpToday: 0,
    hearts: MAX_HEARTS,
    heartsUpdatedAt: now,
  };
}

export function dateKey(time: number): string {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Moves a `YYYY-MM-DD` key by whole days (calendar arithmetic, independent of time zone). */
export function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function previousDateKey(time: number): string {
  return shiftDateKey(dateKey(time), -1);
}

/**
 * Applies hearts that refilled over time and resets the daily XP on a new day.
 * `today` is the learner's local date; the server passes the date the client reported.
 */
export function refresh(p: Progress, now = Date.now(), today = dateKey(now)): Progress {
  let next = p;
  if (p.hearts < MAX_HEARTS) {
    const gained = Math.floor((now - p.heartsUpdatedAt) / HEART_REFILL_MS);
    if (gained > 0) {
      const hearts = Math.min(MAX_HEARTS, p.hearts + gained);
      next = { ...next, hearts, heartsUpdatedAt: p.heartsUpdatedAt + gained * HEART_REFILL_MS };
    }
  }
  if (p.lastActiveDate !== today && p.xpToday !== 0) {
    next = { ...next, xpToday: 0 };
  }
  return next;
}

/** The streak as it should be shown: it is lost once a whole day was skipped. */
export function visibleStreak(p: Progress, now = Date.now()): number {
  if (p.lastActiveDate === dateKey(now) || p.lastActiveDate === previousDateKey(now)) return p.streak;
  return 0;
}

export function msUntilNextHeart(p: Progress, now = Date.now()): number {
  if (p.hearts >= MAX_HEARTS) return 0;
  return Math.max(0, p.heartsUpdatedAt + HEART_REFILL_MS - now);
}

export function loseHeart(p: Progress, now = Date.now()): Progress {
  const current = refresh(p, now);
  if (current.hearts === 0) return current;
  return {
    ...current,
    hearts: current.hearts - 1,
    // Start the refill clock when dropping below full.
    heartsUpdatedAt: current.hearts === MAX_HEARTS ? now : current.heartsUpdatedAt,
  };
}

export function completeLesson(
  p: Progress,
  lessonId: string,
  xp: number,
  now = Date.now(),
  today = dateKey(now),
): Progress {
  const current = refresh(p, now, today);
  let streak = current.streak;
  if (current.lastActiveDate !== today) {
    streak = current.lastActiveDate === shiftDateKey(today, -1) ? streak + 1 : 1;
  }
  return {
    ...current,
    xp: current.xp + xp,
    xpToday: (current.lastActiveDate === today ? current.xpToday : 0) + xp,
    completed: { ...current.completed, [lessonId]: (current.completed[lessonId] ?? 0) + 1 },
    streak,
    lastActiveDate: today,
  };
}

/** A lesson is open once the lesson before it (in course order) was completed. */
export function isUnlocked(p: Progress, lessonId: string): boolean {
  const index = allLessons.findIndex((l) => l.id === lessonId);
  if (index <= 0) return index === 0;
  return (p.completed[allLessons[index - 1].id] ?? 0) > 0;
}

/** The first lesson not yet completed – the one the path highlights. */
export function currentLessonId(p: Progress): string | undefined {
  return allLessons.find((l) => !p.completed[l.id])?.id;
}
