/**
 * Client analytics: anonymous id, offline queue in localStorage, batched flush to
 * Supabase (`public.events`) or the Express server (POST /api/events), opt-out.
 * Spec: docs/spec/v2.md §8. Owned by the BI agent.
 *
 * SCAFFOLD: the exported names and signatures are frozen so the UI can call them now.
 * Every function is a safe no-op until the BI agent implements it. track() must never
 * throw and never block the UI.
 */
import type { AnalyticsEventInput } from '../../shared/analytics';

export const ANON_ID_KEY = 'spourt-english:anon-id:v1';
export const EVENT_QUEUE_KEY = 'spourt-english:events:v1';
export const APP_VERSION = '0.2.0';

/** Queues one event (dropped silently when analytics are disabled). */
export function track(_event: AnalyticsEventInput): void {}

/** Sends queued events in batches if online and a backend is configured. */
export async function flush(): Promise<void> {}

/** Turned off by the Profile toggle (Settings.analytics); clears the queue when turned off. */
export function setAnalyticsEnabled(_enabled: boolean): void {}

/** Sends the `identify` event linking the anonymous id to the signed-in account. */
export function identify(): void {}

/** The anonymous id (created on first use). */
export function anonId(): string {
  return '';
}
