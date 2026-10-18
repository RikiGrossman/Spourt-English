/**
 * Analytics event contract: the canonical event names, the event row sent to the backends
 * and the limits both sides enforce. Spec: docs/spec/v2.md §8.
 * No personal data: never an email, name, IP address or typed answer.
 * Contract file – owned by the backend agent, changes are additive only.
 */
import type { ExerciseType } from '../src/types';

export const ANALYTICS_EVENT_NAMES = [
  'app_open',
  'onboarding_complete',
  'lesson_start',
  'exercise_answer',
  'lesson_complete',
  'lesson_abandon',
  'hearts_out',
  'review_start',
  'review_complete',
  'unit_intro_shown',
  'signup_prompt_shown',
  'signup_prompt_accepted',
  'signup_prompt_dismissed',
  'signup_complete',
  'identify',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type Platform = 'web' | 'pwa' | 'android';

export type PropValue = string | number | boolean | null | string[];

/** What the app passes to track(). The analytics module adds the context fields. */
export interface AnalyticsEventInput {
  name: AnalyticsEventName;
  /** Lesson id (`u3l1`); null for a review session. */
  lessonId?: string | null;
  /** exercise_answer only. */
  itemKey?: string;
  exType?: ExerciseType;
  correct?: boolean;
  firstTry?: boolean;
  /** Duration of a lesson/review (lesson_complete, review_complete). 0 … 3_600_000. */
  durationMs?: number;
  /** Small event-specific extras (docs/spec/v2.md §8.2). Serialized size < MAX_PROPS_BYTES. */
  props?: Record<string, PropValue>;
}

/** A queued/sent event: the input plus anonymous context. */
export interface AnalyticsEvent extends AnalyticsEventInput {
  /** Random UUID kept in localStorage (`spourt-english:anon-id:v1`). */
  anonId: string;
  /** Client ms timestamp. */
  ts: number;
  /** Learner's local date YYYY-MM-DD and hour 0–23. */
  localDate: string;
  localHour: number;
  appVersion: string;
  platform: Platform;
}

/** POST /api/events (optional auth) – responds 204 No Content. */
export interface EventsRequest {
  events: AnalyticsEvent[];
}

export const MAX_EVENTS_PER_BATCH = 50;
export const MAX_QUEUED_EVENTS = 500;
export const MAX_PROPS_BYTES = 1024;
export const MAX_DURATION_MS = 3_600_000;

/**
 * Validates an untrusted batch (Express POST /api/events): drops events with an unknown
 * name, a non-UUID anonId, bad dates/hours or oversized props; at most MAX_EVENTS_PER_BATCH.
 * SCAFFOLD: placeholder – the backend agent implements it and adds tests.
 */
export function sanitizeEvents(_input: unknown): AnalyticsEvent[] {
  return [];
}
