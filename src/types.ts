/** A vocabulary item taught in a lesson. */
export interface Word {
  en: string;
  he: string;
  /** Optional transliteration help, e.g. "הלו" for "hello". */
  sound?: string;
}

/** A full sentence with its translation. `alt` lists other accepted English answers. */
export interface Sentence {
  en: string;
  he: string;
  alt?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  words: Word[];
  sentences: Sentence[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  color: string;
  lessons: Lesson[];
}

export type Exercise =
  | {
      kind: 'choice';
      /** Text shown to the learner. */
      prompt: string;
      /** Language of the prompt – English prompts get a speaker button. */
      promptLang: 'en' | 'he';
      options: string[];
      answer: string;
    }
  | {
      kind: 'build';
      prompt: string;
      promptLang: 'en' | 'he';
      /** Language the learner builds the answer in. */
      answerLang: 'en' | 'he';
      bank: string[];
      answers: string[];
      /** When true the prompt is only spoken (listening exercise). */
      listen?: boolean;
    }
  | {
      kind: 'match';
      pairs: Word[];
    };
