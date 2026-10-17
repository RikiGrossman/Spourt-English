import { allLessons } from '../data/course';
import type { Exercise, Lesson, Sentence, Word } from '../types';
import { tokenize } from './answer';
import { pickDistinct, shuffle, type Rng } from './random';

/** Words from this lesson and every lesson before it – used for distractors. */
function vocabularyUpTo(lesson: Lesson): Word[] {
  const index = allLessons.findIndex((l) => l.id === lesson.id);
  const known = index === -1 ? [lesson] : allLessons.slice(0, index + 1);
  return known.flatMap((l) => l.words);
}

function tilesUpTo(lesson: Lesson, lang: 'en' | 'he'): string[] {
  const index = allLessons.findIndex((l) => l.id === lesson.id);
  const known = index === -1 ? [lesson] : allLessons.slice(0, index + 1);
  return known.flatMap((l) => l.sentences.flatMap((s) => tokenize(s[lang])));
}

function wordChoice(word: Word, vocab: Word[], toEnglish: boolean, rng: Rng): Exercise {
  const lang = toEnglish ? 'en' : 'he';
  const answer = word[lang];
  const distractors = pickDistinct(vocab.map((w) => w[lang]), 3, [answer], rng);
  return {
    kind: 'choice',
    prompt: toEnglish ? word.he : word.en,
    promptLang: toEnglish ? 'he' : 'en',
    options: shuffle([answer, ...distractors], rng),
    answer,
  };
}

function build(sentence: Sentence, lesson: Lesson, answerLang: 'en' | 'he', rng: Rng, listen = false): Exercise {
  const promptLang = listen ? 'en' : answerLang === 'en' ? 'he' : 'en';
  const tiles = tokenize(sentence[answerLang]);
  const extra = pickDistinct(tilesUpTo(lesson, answerLang), Math.min(4, Math.max(2, tiles.length)), tiles, rng);
  return {
    kind: 'build',
    prompt: sentence[promptLang],
    promptLang,
    answerLang,
    bank: shuffle([...tiles, ...extra], rng),
    answers: answerLang === 'en' ? [sentence.en, ...(sentence.alt ?? [])] : [sentence.he],
    listen,
  };
}

/**
 * Builds the exercise sequence for a lesson: new words first (recognition),
 * then a matching round, then sentence building and listening.
 */
export function generateExercises(lesson: Lesson, rng: Rng = Math.random): Exercise[] {
  const vocab = vocabularyUpTo(lesson);
  const exercises: Exercise[] = lesson.words.map((word, i) => wordChoice(word, vocab, i % 2 === 0, rng));

  exercises.push({ kind: 'match', pairs: shuffle(lesson.words, rng).slice(0, 5) });

  const sentences = lesson.sentences;
  const practice: Exercise[] = sentences.map((s) => build(s, lesson, 'en', rng));
  if (sentences.length > 0) {
    practice.push(build(sentences[0], lesson, 'en', rng, true));
    practice.push(build(sentences[sentences.length - 1], lesson, 'he', rng));
  }
  if (sentences.length > 1) {
    practice.push(build(sentences[1], lesson, 'en', rng, true));
  }
  exercises.push(...shuffle(practice, rng));
  return exercises;
}
