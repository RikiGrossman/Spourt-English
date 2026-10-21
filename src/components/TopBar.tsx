import { MAX_HEARTS } from '../lib/progress';

interface Props {
  streak: number;
  xp: number;
  hearts: number;
  gems: number;
  /** Opens the gem shop. */
  onGems: () => void;
}

export function TopBar({ streak, xp, hearts, gems, onGems }: Props) {
  return (
    <header className="top-bar">
      <span className="brand" dir="ltr">
        <img className="brand-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
        Baktana<b>English</b>
      </span>
      <div className="top-stats">
        <span title="רצף ימים" className={streak > 0 ? 'streak-stat on' : 'streak-stat'}>
          🔥 {streak}
        </span>
        <span title="נקודות ניסיון">⭐ {xp}</span>
        <span title={`לבבות (מקסימום ${MAX_HEARTS}, ועוד לבבות בונוס)`}>❤️ {hearts}</span>
        <button type="button" className="gem-stat" onClick={onGems} aria-label={`${gems} יהלומים – לחנות`}>
          💎 {gems}
        </button>
      </div>
    </header>
  );
}
