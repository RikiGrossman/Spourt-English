import { useCallback, useState } from 'react';
import type { Exercise } from '../types';
import { MAX_HEARTS } from '../lib/progress';
import { sounds } from '../lib/sound';
import { useEnterKey } from '../lib/useEnterKey';
import { BuildExercise } from './exercises/BuildExercise';
import { ChoiceExercise } from './exercises/ChoiceExercise';
import { MatchExercise } from './exercises/MatchExercise';

export interface LessonResult {
  xp: number;
  accuracy: number;
}

interface Props {
  exercises: Exercise[];
  /** Current hearts, or null for a practice session where mistakes are free. */
  hearts: number | null;
  onMistake: () => void;
  onFinish: (result: LessonResult) => void;
  onQuit: () => void;
  /** XP for finishing; a flawless run earns a bonus of 5. */
  baseXp?: number;
}

interface Feedback {
  correct: boolean;
  solution: string;
}

const PRAISE = ['מצוין!', 'כל הכבוד!', 'נהדר!', 'מעולה!', 'יפה מאוד!'];

export function lessonResult(total: number, mistakes: number, baseXp = 10): LessonResult {
  return {
    xp: baseXp + (mistakes === 0 ? 5 : 0),
    accuracy: Math.round((total / (total + mistakes)) * 100),
  };
}

/**
 * Runs one lesson. A wrong answer costs a heart and the exercise is queued
 * again at the end, so the lesson only ends once everything was answered right.
 */
export function LessonScreen({ exercises, hearts, onMistake, onFinish, onQuit, baseXp = 10 }: Props) {
  const [queue, setQueue] = useState<Exercise[]>(exercises);
  const [position, setPosition] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(0);

  const exercise = queue[position];
  const percent = (solved / exercises.length) * 100;

  const handleCheck = useCallback(
    (correct: boolean, solution: string) => {
      setFeedback({ correct, solution });
      if (correct) {
        sounds.correct();
        setSolved((n) => n + 1);
      } else {
        sounds.wrong();
        setMistakes((m) => m + 1);
        setQueue((q) => [...q, q[position]]);
        onMistake();
      }
    },
    [position, onMistake],
  );

  function next() {
    setFeedback(null);
    if (position + 1 >= queue.length) {
      onFinish(lessonResult(exercises.length, mistakes, baseXp));
      return;
    }
    setPosition(position + 1);
  }

  useEnterKey(next, feedback !== null);

  if (hearts === 0 && !feedback) {
    return (
      <div className="lesson out-of-hearts">
        <div className="big-emoji pop">💔</div>
        <h2>נגמרו הלבבות</h2>
        <p>לב חדש מתמלא כל 30 דקות. בינתיים אפשר לתרגל שיעורים שסיימתם – בתרגול אין הורדת לבבות.</p>
        <button type="button" className="btn primary" onClick={onQuit} autoFocus>
          חזרה למסלול
        </button>
      </div>
    );
  }

  if (!exercise) return null;

  const props = { locked: feedback !== null, onCheck: handleCheck };
  const praise = PRAISE[position % PRAISE.length];
  const liveText = feedback ? (feedback.correct ? praise : `לא בדיוק. התשובה הנכונה: ${feedback.solution}`) : '';

  return (
    <div className="lesson">
      <header className="lesson-header">
        <button type="button" className="icon-btn" onClick={onQuit} aria-label="יציאה מהשיעור">
          ✕
        </button>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="התקדמות בשיעור"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
        >
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        {hearts === null ? (
          <span className="hearts practice-badge">תרגול</span>
        ) : (
          <span
            className={`hearts${feedback && !feedback.correct ? ' hit' : ''}`}
            aria-label={`${hearts} לבבות מתוך ${MAX_HEARTS}`}
          >
            ❤️ {hearts}
          </span>
        )}
      </header>

      <main className={`lesson-body${feedback ? (feedback.correct ? ' is-correct' : ' is-wrong') : ''}`} key={position}>
        {exercise.kind === 'choice' && <ChoiceExercise exercise={exercise} {...props} />}
        {exercise.kind === 'build' && <BuildExercise exercise={exercise} {...props} />}
        {exercise.kind === 'match' && <MatchExercise exercise={exercise} {...props} />}
      </main>

      <div className="sr-only" role="status" aria-live="assertive">
        {liveText}
      </div>

      {feedback && (
        <footer className={`lesson-footer feedback ${feedback.correct ? 'good' : 'bad'}`}>
          <div className="feedback-text">
            <strong>
              <span className="feedback-icon" aria-hidden="true">
                {feedback.correct ? '✓' : '✕'}
              </span>
              {feedback.correct ? praise : 'לא בדיוק…'}
            </strong>
            {!feedback.correct && (
              <div>
                התשובה הנכונה: <span dir="auto">{feedback.solution}</span>
              </div>
            )}
          </div>
          <button type="button" className={`btn ${feedback.correct ? 'primary' : 'danger'}`} onClick={next} autoFocus>
            המשך
          </button>
        </footer>
      )}
    </div>
  );
}
