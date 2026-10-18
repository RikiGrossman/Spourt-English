/**
 * Review sessions built from due spaced-repetition items. Spec: docs/spec/v2.md §7.2.
 * Owned by the UI agent.
 *
 * SCAFFOLD: falls back to the old random practice until the UI agent implements it.
 */
import { REVIEW_LENGTH } from '../../shared/srs';
import type { Exercise } from '../types';
import { generatePractice } from './practice';
import type { Progress } from './progress';
import type { Rng } from './random';
import type { SrsStore } from './srs';

/**
 * Up to REVIEW_LENGTH exercises: due items weakest first, then upcoming items, then random
 * exercises from completed lessons. Every exercise carries its item key(s).
 */
export function generateReview(
  _srs: SrsStore,
  progress: Progress,
  rng: Rng = Math.random,
  _now = Date.now(),
): Exercise[] {
  return generatePractice(progress, rng, REVIEW_LENGTH);
}
