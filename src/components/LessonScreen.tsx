import { useCallback, useMemo, useState } from 'react';
import type { Exercise, Lesson } from '../types';
import { generateExercises } from '../lib/exercises';
import { MAX_HEARTS } from '../lib/progress';
import { BuildExercise } from './exercises/BuildExercise';
import { ChoiceExercise } from './exercises/ChoiceExercise';
import { MatchExercise } from './exercises/MatchExercise';

export interface LessonResult {
  xp: number;
  accuracy: number;
}

interface Props {
  lesson: Lesson;
  hearts: number;
  onMistake: () => void;
  onFinish: (result: LessonResult) => void;
  onQuit: () => void;
}

interface Feedback {
  correct: boolean;
  solution: string;
}

const PRAISE = ['מצוין!', 'כל הכבוד!', 'נהדר!', 'מעולה!', 'יפה מאוד!'];

/**
 * Runs one lesson. A wrong answer costs a heart and the exercise is queued
 * again at the end, so the lesson only ends once everything was answered right.
 */
export function LessonScreen({ lesson, hearts, onMistake, onFinish, onQuit }: Props) {
  const initial = useMemo(() => generateExercises(lesson), [lesson]);
  const [queue, setQueue] = useState<Exercise[]>(initial);
  const [position, setPosition] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(0);

  const exercise = queue[position];
  const percent = (solved / initial.length) * 100;

  const handleCheck = useCallback(
    (correct: boolean, solution: string) => {
      setFeedback({ correct, solution });
      if (correct) {
        setSolved((n) => n + 1);
      } else {
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
      const accuracy = Math.round((initial.length / (initial.length + mistakes)) * 100);
      onFinish({ xp: 10 + (mistakes === 0 ? 5 : 0), accuracy });
      return;
    }
    setPosition(position + 1);
  }

  if (hearts === 0 && !feedback) {
    return (
      <div className="lesson out-of-hearts">
        <div className="big-emoji">💔</div>
        <h2>נגמרו הלבבות</h2>
        <p>לב חדש מתמלא כל 30 דקות. נסו שוב בקרוב!</p>
        <button type="button" className="btn primary" onClick={onQuit}>
          חזרה למסלול
        </button>
      </div>
    );
  }

  const props = { locked: feedback !== null, onCheck: handleCheck };

  return (
    <div className="lesson">
      <header className="lesson-header">
        <button type="button" className="icon-btn" onClick={onQuit} aria-label="יציאה מהשיעור">
          ✕
        </button>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="hearts" aria-label={`${hearts} לבבות מתוך ${MAX_HEARTS}`}>
          ❤️ {hearts}
        </span>
      </header>

      <main className="lesson-body" key={position}>
        {exercise.kind === 'choice' && <ChoiceExercise exercise={exercise} {...props} />}
        {exercise.kind === 'build' && <BuildExercise exercise={exercise} {...props} />}
        {exercise.kind === 'match' && <MatchExercise exercise={exercise} {...props} />}
      </main>

      {feedback && (
        <footer className={`lesson-footer feedback ${feedback.correct ? 'good' : 'bad'}`}>
          <div className="feedback-text">
            <strong>{feedback.correct ? PRAISE[position % PRAISE.length] : 'לא בדיוק…'}</strong>
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
