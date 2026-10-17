import { course } from '../data/course';
import { currentLessonId, isUnlocked, type Progress } from '../lib/progress';

interface Props {
  progress: Progress;
  onStart: (lessonId: string) => void;
}

/** Zig-zag offsets for the lesson bubbles, like a winding path. */
const OFFSETS = [0, 60, 90, 60, 0, -60, -90, -60];

export function LearningPath({ progress, onStart }: Props) {
  const current = currentLessonId(progress);

  return (
    <div className="path">
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
                <div key={lesson.id} className="lesson-node" style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)` }}>
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
