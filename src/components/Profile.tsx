import { allLessons } from '../data/course';
import { DAILY_GOAL_XP, MAX_HEARTS, msUntilNextHeart, type Progress } from '../lib/progress';

interface Props {
  progress: Progress;
  streak: number;
  onReset: () => void;
}

export function Profile({ progress, streak, onReset }: Props) {
  const done = allLessons.filter((l) => progress.completed[l.id]).length;
  const goal = Math.min(100, (progress.xpToday / DAILY_GOAL_XP) * 100);
  const nextHeart = Math.ceil(msUntilNextHeart(progress) / 60000);

  return (
    <div className="profile">
      <h2>ההתקדמות שלי</h2>
      <div className="stat-cards">
        <div className="stat-card streak">
          <span className="label">רצף ימים</span>
          <span className="value">🔥 {streak}</span>
        </div>
        <div className="stat-card xp">
          <span className="label">סה״כ XP</span>
          <span className="value">⭐ {progress.xp}</span>
        </div>
        <div className="stat-card accuracy">
          <span className="label">שיעורים</span>
          <span className="value">
            {done}/{allLessons.length}
          </span>
        </div>
      </div>

      <section className="panel">
        <h3>יעד יומי</h3>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${goal}%` }} />
        </div>
        <p>
          היום: {progress.xpToday} מתוך {DAILY_GOAL_XP} XP
        </p>
      </section>

      <section className="panel">
        <h3>לבבות</h3>
        <p>
          ❤️ {progress.hearts} מתוך {MAX_HEARTS}
          {progress.hearts < MAX_HEARTS && ` · לב הבא בעוד ${nextHeart} דק׳`}
        </p>
      </section>

      <button
        type="button"
        className="btn ghost"
        onClick={() => {
          if (confirm('לאפס את כל ההתקדמות?')) onReset();
        }}
      >
        איפוס התקדמות
      </button>
    </div>
  );
}
