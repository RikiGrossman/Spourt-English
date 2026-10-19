import { MAX_HEARTS } from '../lib/progress';

interface Props {
  streak: number;
  xp: number;
  hearts: number;
}

export function TopBar({ streak, xp, hearts }: Props) {
  return (
    <header className="top-bar">
      <span className="brand">
        <img className="brand-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
        אנגלית<b>בקטנה</b>
      </span>
      <div className="top-stats">
        <span title="רצף ימים" className={streak > 0 ? 'streak-stat on' : 'streak-stat'}>
          🔥 {streak}
        </span>
        <span title="נקודות ניסיון">⭐ {xp}</span>
        <span title={`לבבות (מקסימום ${MAX_HEARTS})`}>❤️ {hearts}</span>
      </div>
    </header>
  );
}
