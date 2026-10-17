import { describe, expect, it } from 'vitest';
import { allLessons, course } from '../data/course';
import { isCorrect, tokenize } from './answer';
import { generateExercises } from './exercises';
import { seededRng } from './random';

describe('course data', () => {
  it('has unique lesson ids and enough words for every lesson', () => {
    const ids = allLessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const unit of course) expect(unit.lessons.length).toBeGreaterThan(0);
    for (const lesson of allLessons) {
      expect(lesson.words.length).toBeGreaterThanOrEqual(4);
      expect(new Set(lesson.words.map((w) => w.en)).size).toBe(lesson.words.length);
      expect(new Set(lesson.words.map((w) => w.he)).size).toBe(lesson.words.length);
    }
  });
});

describe('generateExercises', () => {
  for (const lesson of allLessons) {
    it(`builds solvable exercises for ${lesson.id}`, () => {
      const exercises = generateExercises(lesson, seededRng(42));
      expect(exercises.length).toBeGreaterThan(lesson.words.length);
      for (const ex of exercises) {
        if (ex.kind === 'choice') {
          expect(ex.options).toContain(ex.answer);
          expect(new Set(ex.options).size).toBe(ex.options.length);
        } else if (ex.kind === 'build') {
          // The primary answer must be buildable from the bank's tiles.
          const bank = [...ex.bank];
          const tiles = tokenize(ex.answers[0]);
          for (const tile of tiles) {
            const i = bank.indexOf(tile);
            expect(i, `missing tile "${tile}"`).toBeGreaterThanOrEqual(0);
            bank.splice(i, 1);
          }
          expect(isCorrect(tiles.join(' '), ex.answers)).toBe(true);
        } else {
          expect(ex.pairs.length).toBeGreaterThanOrEqual(4);
        }
      }
    });
  }

  it('is deterministic with a seeded rng', () => {
    const lesson = allLessons[0];
    expect(generateExercises(lesson, seededRng(7))).toEqual(generateExercises(lesson, seededRng(7)));
  });
});
