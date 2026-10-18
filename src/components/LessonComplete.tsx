import { useEffect, type ReactNode } from 'react';
import { sounds } from '../lib/sound';
import type { LessonResult } from './LessonScreen';

interface Props {
  result: LessonResult;
  streak: number;
  /** True when this lesson took today's XP across the daily goal. */
  goalReached?: boolean;
  /** A lesson, a spaced-repetition review, or a review made of random practice. */
  kind?: 'lesson' | 'review' | 'practice';
  /** Optional sign-up card (guests only, docs/spec/v2.md §7.4). */
  signupPrompt?: ReactNode;
  onContinue: () => void;
}

const TITLES = { lesson: 'השיעור הושלם!', review: 'החזרה הושלמה!', practice: 'התרגול הושלם!' };
const EMOJIS = { lesson: '🎉', review: '🧠', practice: '💪' };

const CONFETTI_COLORS = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff', '#ff9600'];

export function LessonComplete({
  result,
  streak,
  goalReached = false,
  kind = 'lesson',
  signupPrompt,
  onContinue,
}: Props) {
  useEffect(() => {
    sounds.complete();
  }, []);

  return (
    <div className="lesson-complete">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <i
            key={i}
            style={{
              insetInlineStart: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 8) * 0.12}s`,
              animationDuration: `${1.8 + (i % 5) * 0.3}s`,
            }}
          />
        ))}
      </div>
      <div className="big-emoji pop" aria-hidden="true">
        {EMOJIS[kind]}
      </div>
      <h2 className="pop" role="status">
        {TITLES[kind]}
      </h2>
      {goalReached && <p className="goal-banner pop">🎯 עמדתם ביעד היומי! כל הכבוד!</p>}
      <div className="stat-cards">
        <div className="stat-card xp rise" style={{ animationDelay: '0.1s' }}>
          <span className="label">נקודות XP</span>
          <span className="value">⚡ +{result.xp}</span>
        </div>
        <div className="stat-card accuracy rise" style={{ animationDelay: '0.2s' }}>
          <span className="label">דיוק</span>
          <span className="value">🎯 {result.accuracy}%</span>
        </div>
        <div className="stat-card streak rise" style={{ animationDelay: '0.3s' }}>
          <span className="label">רצף ימים</span>
          <span className="value">🔥 {streak}</span>
        </div>
      </div>
      {signupPrompt}
      <button type="button" className="btn primary" onClick={onContinue} autoFocus>
        המשך
      </button>
    </div>
  );
}
