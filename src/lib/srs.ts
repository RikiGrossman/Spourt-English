/**
 * Client spaced-repetition engine: local storage, seeding, box updates, due lists
 * and (Should) sync through /api/srs or Supabase. Spec: docs/spec/v2.md §6.3, §7.2.
 * Owned by the backend agent.
 *
 * SCAFFOLD: the exported names and signatures are frozen so the UI can build against them.
 * Bodies are safe placeholders (nothing is ever due) until the backend agent implements them.
 */
import { useCallback, useState } from 'react';
import type { ItemStates } from '../../shared/srs';
import type { ItemAnswer } from '../types';
import type { Progress } from './progress';
import type { Rng } from './random';

export const SRS_STORAGE_KEY = 'spourt-english:srs:v1';

/** What is kept under SRS_STORAGE_KEY. */
export interface SrsStore {
  v: 1;
  items: ItemStates;
  /** True once existing progress was seeded (or there was nothing to seed). */
  seeded: boolean;
  /** Keys changed since the last successful sync (Should: SRS sync). */
  dirty: string[];
}

/** 'lesson' answers come from a lesson, 'review' answers from a review session. */
export type AnswerMode = 'lesson' | 'review';

export function emptySrs(): SrsStore {
  return { v: 1, items: {}, seeded: false, dirty: [] };
}

/** Reads the store; a missing, blocked or corrupt store yields emptySrs(). Never throws. */
export function loadSrs(): SrsStore {
  return emptySrs();
}

/** Writes the store; storage errors are ignored. */
export function saveSrs(_store: SrsStore): void {}

/**
 * One-time seeding for learners who finished lessons before this release: every word and
 * sentence of every completed lesson gets box 1, due today + rng-spread 0..SEED_SPREAD_DAYS.
 * Sets `seeded`. Returns the store unchanged if it is already seeded.
 */
export function seedFromProgress(store: SrsStore, _progress: Progress, _now = Date.now(), _rng?: Rng): SrsStore {
  return { ...store, seeded: true };
}

/**
 * Applies the answers of one finished session (rules in docs/spec/v2.md §6.3).
 * At most one update per item key per call (the first answer counts).
 */
export function applyAnswers(store: SrsStore, _answers: ItemAnswer[], _mode: AnswerMode, _now = Date.now()): SrsStore {
  return store;
}

/** Keys due today or earlier, weakest first (lowest box, then most wrong/seen, then oldest due). */
export function dueKeys(_store: SrsStore, _now = Date.now()): string[] {
  return [];
}

export function dueCount(store: SrsStore, now = Date.now()): number {
  return dueKeys(store, now).length;
}

/**
 * Keys that are not due yet but closest to due, weakest first – used to fill a review
 * session when fewer than REVIEW_LENGTH items are due.
 */
export function upcomingKeys(_store: SrsStore, _limit: number, _now = Date.now()): string[] {
  return [];
}

export interface SrsApi {
  store: SrsStore;
  /** Number of items due now. */
  due: number;
  /** Records a finished lesson or review session and persists it. */
  record: (answers: ItemAnswer[], mode: AnswerMode) => void;
}

/**
 * React hook used by App.tsx: loads (and seeds) the store, persists every change and,
 * when `signedIn` (App passes `account.user !== null`), syncs in the background (Should).
 * Works offline and for guests.
 */
export function useSrs(_progress: Progress, _signedIn = false): SrsApi {
  const [store, setStore] = useState<SrsStore>(loadSrs);
  const record = useCallback((answers: ItemAnswer[], mode: AnswerMode) => {
    setStore((s) => applyAnswers(s, answers, mode));
  }, []);
  return { store, due: dueCount(store), record };
}
