/**
 * Validation and merge of uploaded spaced-repetition state. Used by the Express server
 * (PUT /api/srs), the Supabase client path (src/lib/cloud.ts) and the client after a pull.
 * Spec: docs/spec/v2.md §6.3. Owned by the backend agent.
 *
 * SCAFFOLD: signatures are frozen; the bodies below are placeholders the backend agent
 * replaces (and covers with tests).
 */
import type { ItemState, ItemStates } from './srs';

/**
 * Validates untrusted item states: keeps only valid item keys (isItemKey), boxes 0–5,
 * real YYYY-MM-DD dates no more than MAX_DUE_AHEAD_DAYS ahead, non-negative integers,
 * `last` not after `now`; at most `limit` entries. Returns null if `input` is not an object.
 */
export function sanitizeItemStates(input: unknown, _now = Date.now(), _limit?: number): ItemStates | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  return {};
}

/**
 * Merges one item: the state with the newer `last` wins (box, due, last);
 * on equal `last` the lower box wins; `seen` and `wrong` are the maximum of both.
 */
export function mergeItemState(a: ItemState, _b: ItemState): ItemState {
  return a;
}

/** Merges two maps item by item with mergeItemState (keys present on one side are kept). */
export function mergeItemStates(stored: ItemStates, incoming: ItemStates): ItemStates {
  return { ...incoming, ...stored };
}
