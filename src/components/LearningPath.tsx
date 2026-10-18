import { course } from '../data/course';
import { dailyGoalOf } from '../lib/goals';
import { canPractice } from '../lib/practice';
import { currentLessonId, isUnlocked, type Progress } from '../lib/progress';

interface Props {
  progress: Progress;
  onStart: (lessonId: string) => void;
  onPractice: () => void;
}

/** Zig-zag offsets for the lesson bubbles, like a winding path. */
const OFFSETS = [0, 60, 90, 60, 0, -60, -90, -60];

export function LearningPath({ progress, onStart, onPractice }: Props) {
  const current = currentLessonId(progress);
  const goal = dailyGoalOf(progress);
  const goalPercent = Math.min(100, (progress.xpToday / goal) * 100);
  const practice = canPractice(progress);

  return (
    <div className="path">
      <section className="today-card">
        <div className="today-goal">
          <div className="today-head">
            <strong>🎯 יעד יומי</strong>
            <span className="muted" dir="ltr">
              {Math.min(progress.xpToday, goal)}/{goal} XP
            </span>
          </div>
          <div className="progress-track small" aria-hidden="true">
            <div className="progress-fill gold" style={{ width: `${goalPercent}%` }} />
          </div>
        </div>
        <button
          type="button"
          className="btn secondary practice-btn"
          onClick={onPractice}
          disabled={!practice}
          title={practice ? 'חזרה על שיעורים שסיימתם' : 'סיימו שיעור כדי לפתוח תרגול'}
        >
          💪 תרגול
        </button>
      </section>

      {course.map((unit) => (
        <section key={unit.id} className="unit">
          <div className="unit-banner" style={{ background: unit.color }}>
            <h2>{unit.title}</h2>
            <p>{unit.description}</p>
          </div>
          <div className="unit-lessons">
            {unit.lessons.map((lesson, i) => {
              const done = (progress.completed[lesson.id] ?? 0) > 0;
              const open = isUnlocked(progress, lesson.id);
              const isCurrent = lesson.id === current;
              return (
                <div
                  key={lesson.id}
                  className={`lesson-node${isCurrent ? ' has-label' : ''}`}
                  style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)` }}
                >
                  {isCurrent && <span className="start-label">התחילו!</span>}
                  <button
                    type="button"
                    className={`node-btn${done ? ' done' : ''}${isCurrent ? ' current' : ''}`}
                    style={open ? { background: unit.color } : undefined}
                    disabled={!open}
                    onClick={() => onStart(lesson.id)}
                    aria-label={`${lesson.title}${done ? ' (הושלם)' : open ? '' : ' (נעול)'}`}
                  >
                    {done ? '✓' : open ? '★' : '🔒'}
                  </button>
                  <span className="node-title">{lesson.title}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
