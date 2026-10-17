import type { LessonResult } from './LessonScreen';

interface Props {
  result: LessonResult;
  streak: number;
  onContinue: () => void;
}

export function LessonComplete({ result, streak, onContinue }: Props) {
  return (
    <div className="lesson-complete">
      <div className="big-emoji">🎉</div>
      <h2>השיעור הושלם!</h2>
      <div className="stat-cards">
        <div className="stat-card xp">
          <span className="label">נקודות XP</span>
          <span className="value">+{result.xp}</span>
        </div>
        <div className="stat-card accuracy">
          <span className="label">דיוק</span>
          <span className="value">{result.accuracy}%</span>
        </div>
        <div className="stat-card streak">
          <span className="label">רצף ימים</span>
          <span className="value">🔥 {streak}</span>
        </div>
      </div>
      <button type="button" className="btn primary" onClick={onContinue} autoFocus>
        המשך
      </button>
    </div>
  );
}
