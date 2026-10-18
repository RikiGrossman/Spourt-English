import { useCallback, useEffect, useState } from 'react';
import type { LeaderboardEntry, User } from '../../shared/api';
import { api, errorMessage } from '../lib/api';

interface Props {
  user: User | null;
  onSignIn: () => void;
}

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; entries: LeaderboardEntry[] };

const MEDALS = ['🥇', '🥈', '🥉'];

/** Weekly XP league. Needs an account – guests get a friendly invitation instead. */
export function Leaderboard({ user, onSignIn }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(() => {
    setState({ kind: 'loading' });
    api.leaderboard().then(
      (res) => setState({ kind: 'ready', entries: res.entries }),
      (err) => setState({ kind: 'error', message: errorMessage(err) }),
    );
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!user) {
    return (
      <div className="leaderboard empty-state">
        <div className="big-emoji" aria-hidden="true">
          🏆
        </div>
        <h2>הליגה השבועית</h2>
        <p>צרו פרופיל כדי להתחרות עם לומדים אחרים ולראות כמה XP צברתם השבוע.</p>
        <button type="button" className="btn primary" onClick={onSignIn}>
          יצירת פרופיל
        </button>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2>🏆 הליגה השבועית</h2>
      <p className="muted">דירוג לפי XP בשבעת הימים האחרונים</p>

      {state.kind === 'loading' && (
        <ol className="board" aria-busy="true" aria-label="טוען דירוג">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="board-row skeleton" />
          ))}
        </ol>
      )}

      {state.kind === 'error' && (
        <div className="panel center">
          <p>📡 {state.message}</p>
          <button type="button" className="btn ghost" onClick={load}>
            נסו שוב
          </button>
        </div>
      )}

      {state.kind === 'ready' && state.entries.length === 0 && (
        <div className="panel center">
          <p>עדיין אין אף אחד בליגה השבוע. סיימו שיעור ותהיו הראשונים!</p>
        </div>
      )}

      {state.kind === 'ready' && state.entries.length > 0 && (
        <ol className="board">
          {state.entries.map((entry) => (
            <li key={`${entry.rank}-${entry.displayName}`} className={`board-row${entry.isMe ? ' me' : ''}`}>
              <span className="board-rank">{MEDALS[entry.rank - 1] ?? entry.rank}</span>
              <span className="board-avatar" aria-hidden="true">
                {entry.displayName.trim().charAt(0).toUpperCase() || '?'}
              </span>
              <span className="board-name" dir="auto">
                {entry.displayName}
                {entry.isMe && <span className="me-tag"> (אני)</span>}
              </span>
              <span className="board-xp" dir="ltr">
                {entry.weeklyXp} XP
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
