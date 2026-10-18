import type { User } from '../../shared/api';
import { allLessons } from '../data/course';
import type { SyncStatus } from '../lib/account';
import { GOAL_OPTIONS, dailyGoalOf } from '../lib/goals';
import { MAX_HEARTS, msUntilNextHeart, type Progress } from '../lib/progress';
import type { Settings, ThemeChoice } from '../lib/settings';

interface Props {
  progress: Progress;
  streak: number;
  user: User | null;
  syncStatus: SyncStatus;
  settings: Settings;
  onSettings: (patch: Partial<Settings>) => void;
  onGoal: (xp: number) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSync: () => void;
  onReset: () => void;
}

const SYNC_TEXT: Record<SyncStatus, string> = {
  guest: '',
  syncing: '🔄 מסנכרן…',
  synced: '✅ ההתקדמות מסונכרנת',
  offline: '📡 אין חיבור – ההתקדמות נשמרת במכשיר ותסונכרן אחר כך',
};

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'אוטומטי' },
  { value: 'light', label: '☀️ בהיר' },
  { value: 'dark', label: '🌙 כהה' },
];

export function Profile(props: Props) {
  const { progress, streak, user, syncStatus, settings } = props;
  const done = allLessons.filter((l) => progress.completed[l.id]).length;
  const goalXp = dailyGoalOf(progress);
  const goal = Math.min(100, (progress.xpToday / goalXp) * 100);
  const nextHeart = Math.ceil(msUntilNextHeart(progress) / 60000);

  return (
    <div className="profile">
      <section className="account-card">
        <div className="avatar" aria-hidden="true">
          {user ? user.displayName.trim().charAt(0).toUpperCase() || '🙂' : '🙂'}
        </div>
        <div className="account-info">
          <h2 dir="auto">{user ? user.displayName : 'אורח/ת'}</h2>
          {user ? (
            <>
              <span className="muted" dir="ltr">
                {user.email}
              </span>
              <span className="sync-status" role="status">
                {SYNC_TEXT[syncStatus]}
              </span>
            </>
          ) : (
            <span className="muted">ההתקדמות נשמרת רק במכשיר הזה</span>
          )}
        </div>
      </section>
      <div className="account-actions">
        {user ? (
          <>
            {syncStatus === 'offline' && (
              <button type="button" className="btn ghost small" onClick={props.onSync}>
                סנכרון עכשיו
              </button>
            )}
            <button type="button" className="btn ghost small" onClick={props.onSignOut}>
              התנתקות
            </button>
          </>
        ) : (
          <button type="button" className="btn secondary wide" onClick={props.onSignIn}>
            יצירת פרופיל / התחברות
          </button>
        )}
      </div>

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
        <div
          className="progress-track"
          role="progressbar"
          aria-label="התקדמות ביעד היומי"
          aria-valuemin={0}
          aria-valuemax={goalXp}
          aria-valuenow={Math.min(progress.xpToday, goalXp)}
        >
          <div className="progress-fill gold" style={{ width: `${goal}%` }} />
        </div>
        <p>
          היום: {progress.xpToday} מתוך <bdi>{goalXp} XP</bdi>
        </p>
        <div className="chips" role="radiogroup" aria-label="בחירת יעד יומי">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={option.xp}
              type="button"
              role="radio"
              aria-checked={goalXp === option.xp}
              className={`chip${goalXp === option.xp ? ' selected' : ''}`}
              onClick={() => props.onGoal(option.xp)}
            >
              {option.label} · {option.xp}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>לבבות</h3>
        <p>
          ❤️ {progress.hearts} מתוך {MAX_HEARTS}
          {progress.hearts < MAX_HEARTS && ` · לב הבא בעוד ${nextHeart} דק׳`}
        </p>
      </section>

      <section className="panel">
        <h3>הגדרות</h3>
        <div className="setting-row">
          <span id="theme-label">מראה</span>
          <div className="chips" role="radiogroup" aria-labelledby="theme-label">
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                type="button"
                role="radio"
                aria-checked={settings.theme === theme.value}
                className={`chip${settings.theme === theme.value ? ' selected' : ''}`}
                onClick={() => props.onSettings({ theme: theme.value })}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <span id="sound-label">צלילים</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.sound}
            aria-labelledby="sound-label"
            className={`switch${settings.sound ? ' on' : ''}`}
            onClick={() => props.onSettings({ sound: !settings.sound })}
          >
            <span className="switch-knob" />
          </button>
        </div>
      </section>

      <button
        type="button"
        className="btn ghost"
        onClick={() => {
          if (confirm('לאפס את כל ההתקדמות במכשיר הזה?')) props.onReset();
        }}
      >
        איפוס התקדמות
      </button>
    </div>
  );
}
