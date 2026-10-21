import { MAX_HEARTS } from '../lib/progress';

interface Props {
  streak: number;
  xp: number;
  hearts: number;
  gems: number;
  /** Opens the gem shop. */
  onGems: () => void;
  /** The signed-in learner is a premium member (shows a badge under the logo). */
  premium?: boolean;
}

export function TopBar({ streak, xp, hearts, gems, onGems, premium }: Props) {
  return (
    <header className="top-bar">
      <div className="brand-block" dir="ltr">
        <span className="brand">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
          Baktana<b>English</b>
        </span>
        {premium && <PremiumBadge />}
      </div>
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

/** The "you're premium" mark, used in the top bar and on the profile. */
export function PremiumBadge() {
  return (
    <span className="premium-badge" dir="rtl" title="מנוי פרימיום פעיל">
      👑<span className="premium-label"> פרימיום</span>
    </span>
  );
}
