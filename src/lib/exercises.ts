import { sentenceKey, wordKey } from '../../shared/item-keys';
import { allLessons } from '../data/course';
import type { Exercise, ExerciseType, Lesson, Word } from '../types';
import { tokenize } from './answer';
import { pickDistinct, shuffle, type Rng } from './random';

function lessonsUpTo(lesson: Lesson): Lesson[] {
  const index = allLessons.findIndex((l) => l.id === lesson.id);
  return index === -1 ? [lesson] : allLessons.slice(0, index + 1);
}

/** Words from this lesson and every lesson before it – used for distractors. */
export function vocabularyUpTo(lesson: Lesson): Word[] {
  return lessonsUpTo(lesson).flatMap((l) => l.words);
}

function tilesUpTo(lesson: Lesson, lang: 'en' | 'he'): string[] {
  return lessonsUpTo(lesson).flatMap((l) => l.sentences.flatMap((s) => tokenize(s[lang])));
}

/** A multiple-choice question about one word, in either direction. */
export function wordChoice(word: Word, vocab: Word[], toEnglish: boolean, rng: Rng): Exercise {
  const lang = toEnglish ? 'en' : 'he';
  const answer = word[lang];
  const distractors = pickDistinct(
    vocab.map((w) => w[lang]),
    3,
    [answer],
    rng,
  );
  return {
    kind: 'choice',
    prompt: toEnglish ? word.he : word.en,
    promptLang: toEnglish ? 'he' : 'en',
    options: shuffle([answer, ...distractors], rng),
    answer,
    itemKey: wordKey(word),
  };
}

/**
 * Sentence building from a word bank. When answering in Hebrew the other forms
 * (`heAlt`, mainly feminine) are accepted too, and the words the first one needs are
 * added to the bank (they count as distractors for the main answer).
 */
export function buildSentence(
  lesson: Lesson,
  index: number,
  answerLang: 'en' | 'he',
  rng: Rng,
  listen = false,
): Exercise {
  const sentence = lesson.sentences[index];
  const promptLang = listen ? 'en' : answerLang === 'en' ? 'he' : 'en';
  const tiles = tokenize(sentence[answerLang]);
  const heAlt = answerLang === 'he' ? (sentence.heAlt ?? []) : [];
  const altTiles = heAlt.length > 0 ? [...new Set(tokenize(heAlt[0]).filter((t) => !tiles.includes(t)))] : [];
  const extra = pickDistinct(
    tilesUpTo(lesson, answerLang),
    Math.min(4, Math.max(2, tiles.length)),
    [...tiles, ...altTiles],
    rng,
  );
  return {
    kind: 'build',
    prompt: sentence[promptLang],
    promptLang,
    answerLang,
    bank: shuffle([...tiles, ...altTiles, ...extra], rng),
    answers: answerLang === 'en' ? [sentence.en, ...(sentence.alt ?? [])] : [sentence.he, ...heAlt],
    listen,
    itemKey: sentenceKey(lesson.id, index),
    ...(sentence.errors?.length ? { errors: sentence.errors } : {}),
  };
}

/** The exercise type reported to analytics (docs/spec/v2.md §6.1). */
export function exerciseType(exercise: Exercise): ExerciseType {
  if (exercise.kind === 'match') return 'match';
  if (exercise.kind === 'choice') return exercise.promptLang === 'he' ? 'choice-en' : 'choice-he';
  if (exercise.listen) return 'listen';
  return exercise.answerLang === 'en' ? 'build-en' : 'build-he';
}

/**
 * Builds the exercise sequence for a lesson: new words first (recognition),
 * then a matching round, then sentence building and listening.
 * Every exercise carries its spaced-repetition item key(s).
 */
export function generateExercises(lesson: Lesson, rng: Rng = Math.random): Exercise[] {
  const vocab = vocabularyUpTo(lesson);
  const exercises: Exercise[] = lesson.words.map((word, i) => wordChoice(word, vocab, i % 2 === 0, rng));

  const pairs = shuffle(lesson.words, rng).slice(0, 5);
  exercises.push({ kind: 'match', pairs, itemKeys: pairs.map(wordKey) });

  const n = lesson.sentences.length;
  const practice: Exercise[] = lesson.sentences.map((_, i) => buildSentence(lesson, i, 'en', rng));
  if (n > 0) {
    practice.push(buildSentence(lesson, 0, 'en', rng, true));
    practice.push(buildSentence(lesson, n - 1, 'he', rng));
  }
  if (n > 1) {
    practice.push(buildSentence(lesson, 1, 'en', rng, true));
  }
  exercises.push(...shuffle(practice, rng));
  return exercises;
}
