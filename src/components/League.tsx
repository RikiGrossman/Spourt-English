import { useState } from 'react';
import type { User } from '../../shared/api';
import type { GroupsState } from '../lib/groups';
import { GroupBoard } from './GroupBoard';
import { Leaderboard } from './Leaderboard';
import { MyGroups } from './MyGroups';

export type LeagueView = 'me' | 'groups' | 'mine';

interface Props {
  user: User | null;
  groups: GroupsState;
  initialView?: LeagueView;
  onSignIn: () => void;
  onGems: (gems: number) => void;
  joinCode: string | null;
  onJoinCodeUsed: () => void;
}

const VIEWS: { view: LeagueView; label: string }[] = [
  { view: 'me', label: '🏆 אישי' },
  { view: 'groups', label: '🏟️ קבוצות' },
  { view: 'mine', label: '👥 הקבוצות שלי' },
];

/** The league tab: the personal league, the group league, and the learner's own groups. */
export function League({ user, groups, initialView = 'me', onSignIn, onGems, joinCode, onJoinCodeUsed }: Props) {
  const [view, setView] = useState<LeagueView>(initialView);
  return (
    <div className="league">
      <div className="league-tabs" role="tablist" aria-label="סוג הדירוג">
        {VIEWS.map(({ view: v, label }) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            className={view === v ? 'active' : ''}
            onClick={() => setView(v)}
          >
            {label}
            {v === 'mine' && groups.unread > 0 && view !== 'mine' && (
              <span className="badge" aria-label={`${groups.unread} התראות חדשות`}>
                {groups.unread}
              </span>
            )}
          </button>
        ))}
      </div>
      {view === 'me' && <Leaderboard user={user} onSignIn={onSignIn} />}
      {view === 'groups' && <GroupBoard user={user} />}
      {view === 'mine' && (
        <MyGroups
          user={user}
          state={groups}
          onSignIn={onSignIn}
          onGems={onGems}
          joinCode={joinCode}
          onJoinCodeUsed={onJoinCodeUsed}
        />
      )}
    </div>
  );
}
