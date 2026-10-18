import { useCallback, useEffect, useState } from 'react';
import type { AuthResponse } from '../shared/api';
import { findLesson } from './data/course';
import { AuthScreen } from './components/AuthScreen';
import { LearningPath } from './components/LearningPath';
import { Leaderboard } from './components/Leaderboard';
import { LessonComplete } from './components/LessonComplete';
import { LessonScreen, type LessonResult } from './components/LessonScreen';
import { Onboarding } from './components/Onboarding';
import { Profile } from './components/Profile';
import { TopBar } from './components/TopBar';
import { useAccount } from './lib/account';
import { generateExercises } from './lib/exercises';
import { needsOnboarding, reachesGoal, setDailyGoal } from './lib/goals';
import { PRACTICE_XP, completePractice, generatePractice } from './lib/practice';
import { completeLesson, loseHeart, visibleStreak } from './lib/progress';
import { setSoundEnabled } from './lib/sound';
import { useSettings } from './lib/settings';
import { useProgress } from './lib/store';
import type { Exercise } from './types';

type Tab = 'path' | 'league' | 'profile';

type Screen =
  | { name: Tab }
  | { name: 'auth'; back: Tab | 'onboarding'; mode?: 'login' | 'register' }
  /** `lessonId` is null for a practice session. */
  | { name: 'lesson'; lessonId: string | null; exercises: Exercise[] }
  | { name: 'complete'; result: LessonResult; goalReached: boolean; practice: boolean };

const TABS: { name: Tab; icon: string; label: string }[] = [
  { name: 'path', icon: '🏠', label: 'לימוד' },
  { name: 'league', icon: '🏆', label: 'ליגה' },
  { name: 'profile', icon: '👤', label: 'פרופיל' },
];

export default function App() {
  const { progress, update, reset } = useProgress();
  const { settings, change: changeSettings } = useSettings();
  const account = useAccount(progress, update);
  const [screen, setScreen] = useState<Screen>({ name: 'path' });
  const streak = visibleStreak(progress);

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound]);

  const onMistake = useCallback(() => update((p) => loseHeart(p)), [update]);
  const noop = useCallback(() => {}, []);

  function signedIn(res: AuthResponse) {
    account.signIn(res);
    setScreen({ name: 'profile' });
  }

  if (screen.name === 'auth') {
    return (
      <AuthScreen
        initialMode={screen.mode}
        onSignedIn={signedIn}
        onCancel={() => setScreen({ name: screen.back === 'onboarding' ? 'path' : screen.back })}
      />
    );
  }

  if (needsOnboarding(progress)) {
    return (
      <Onboarding
        onDone={(goal) => update((p) => setDailyGoal(p, goal))}
        onSignIn={() => setScreen({ name: 'auth', back: 'onboarding', mode: 'login' })}
      />
    );
  }

  if (screen.name === 'lesson') {
    const { lessonId } = screen;
    const practice = lessonId === null;
    return (
      <LessonScreen
        exercises={screen.exercises}
        hearts={practice ? null : progress.hearts}
        onMistake={practice ? noop : onMistake}
        onQuit={() => setScreen({ name: 'path' })}
        onFinish={(result) => {
          const after = practice
            ? completePractice(progress, result.xp)
            : completeLesson(progress, lessonId, result.xp);
          update((p) => (practice ? completePractice(p, result.xp) : completeLesson(p, lessonId, result.xp)));
          if (practice) void account.sync();
          else account.reportLesson(lessonId, result);
          setScreen({ name: 'complete', result, goalReached: reachesGoal(progress, after), practice });
        }}
        baseXp={practice ? PRACTICE_XP : 10}
      />
    );
  }

  if (screen.name === 'complete') {
    return (
      <LessonComplete
        result={screen.result}
        streak={streak}
        goalReached={screen.goalReached}
        practice={screen.practice}
        onContinue={() => setScreen({ name: 'path' })}
      />
    );
  }

  function startLesson(lessonId: string) {
    const found = findLesson(lessonId);
    if (found) setScreen({ name: 'lesson', lessonId, exercises: generateExercises(found.lesson) });
  }

  function startPractice() {
    const exercises = generatePractice(progress);
    if (exercises.length > 0) setScreen({ name: 'lesson', lessonId: null, exercises });
  }

  const goAuth = () => setScreen({ name: 'auth', back: screen.name });

  return (
    <div className="app">
      <TopBar streak={streak} xp={progress.xp} hearts={progress.hearts} />
      <main className="content" key={screen.name}>
        {screen.name === 'path' && (
          <LearningPath progress={progress} onStart={startLesson} onPractice={startPractice} />
        )}
        {screen.name === 'league' && <Leaderboard user={account.user} onSignIn={goAuth} />}
        {screen.name === 'profile' && (
          <Profile
            progress={progress}
            streak={streak}
            user={account.user}
            syncStatus={account.status}
            settings={settings}
            onSettings={changeSettings}
            onGoal={(xp) => update((p) => setDailyGoal(p, xp))}
            onSignIn={goAuth}
            onSignOut={account.signOut}
            onSync={() => void account.sync()}
            onReset={reset}
          />
        )}
      </main>
      <nav className="bottom-nav" aria-label="ניווט ראשי">
        {TABS.map((tab) => (
          <button
            key={tab.name}
            type="button"
            className={screen.name === tab.name ? 'active' : ''}
            aria-current={screen.name === tab.name ? 'page' : undefined}
            onClick={() => setScreen({ name: tab.name })}
          >
            <span aria-hidden="true">{tab.icon}</span> <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
