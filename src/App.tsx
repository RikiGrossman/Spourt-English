import { useCallback, useEffect, useState } from 'react';
import { MAX_DURATION_MS } from '../shared/analytics';
import type { AuthResponse } from '../shared/api';
import { REVIEW_XP } from '../shared/srs';
import { findLesson } from './data/course';
import { AuthScreen, type Mode as AuthMode } from './components/AuthScreen';
import { LearningPath } from './components/LearningPath';
import { Leaderboard } from './components/Leaderboard';
import { LessonComplete } from './components/LessonComplete';
import { LessonScreen, type LessonResult } from './components/LessonScreen';
import { Onboarding } from './components/Onboarding';
import { Profile } from './components/Profile';
import { SignupPrompt } from './components/SignupPrompt';
import { TopBar } from './components/TopBar';
import { UnitIntro } from './components/UnitIntro';
import { useAccount } from './lib/account';
import { identify, setAnalyticsEnabled, track } from './lib/analytics';
import { ACCOUNTS_ENABLED } from './lib/config';
import { generateExercises } from './lib/exercises';
import { needsOnboarding, reachesGoal, setDailyGoal } from './lib/goals';
import { loadIntroSeen, markIntroSeen, shouldAutoShowIntro } from './lib/intro-seen';
import { completePractice } from './lib/practice';
import { completeLesson, isCatchUp, loseHeart, visibleStreak } from './lib/progress';
import { buildReview, type ReviewSource } from './lib/review';
import {
  dismiss,
  lessonsCompleted,
  loadSignupPrompt,
  markShown,
  retire,
  saveSignupPrompt,
  signupRound,
  type SignupRound,
} from './lib/signup-prompt';
import { setSoundEnabled } from './lib/sound';
import { useSettings } from './lib/settings';
import { useSrs } from './lib/srs';
import { useProgress } from './lib/store';
import type { Exercise, Unit } from './types';

type Tab = 'path' | 'league' | 'profile';

/** Where a sign-up started, reported with `signup_complete`. */
type AuthFrom = 'prompt' | 'profile' | 'onboarding';

type Screen =
  | { name: Tab }
  | { name: 'auth'; back: Tab | 'onboarding'; mode?: AuthMode; from: AuthFrom }
  /** `lessonId` is null for a review session. */
  | {
      name: 'lesson';
      lessonId: string | null;
      exercises: Exercise[];
      tip?: string;
      tipTitle?: string;
      source?: ReviewSource;
    }
  | {
      name: 'complete';
      result: LessonResult;
      goalReached: boolean;
      kind: 'lesson' | 'review' | 'practice';
      signup: { round: SignupRound; lessonsCompleted: number } | null;
    };

interface IntroState {
  unit: Unit;
  trigger: 'auto' | 'button';
  /** The lesson to open after "יאללה, מתחילים" (auto only). */
  lessonId?: string;
}

const ALL_TABS: { name: Tab; icon: string; label: string }[] = [
  { name: 'path', icon: '🏠', label: 'לימוד' },
  { name: 'league', icon: '🏆', label: 'ליגה' },
  { name: 'profile', icon: '👤', label: 'פרופיל' },
];

// The league needs the API server, so static deploys leave it out.
const TABS = ACCOUNTS_ENABLED ? ALL_TABS : ALL_TABS.filter((tab) => tab.name !== 'league');

/** `app_open` is sent once per launch (StrictMode mounts effects twice in development). */
let appOpenSent = false;

export default function App() {
  const { progress, update, reset } = useProgress();
  const { settings, change: changeSettings } = useSettings();
  const account = useAccount(progress, update);
  const srs = useSrs(progress, account.user !== null);
  const [screen, setScreen] = useState<Screen>({ name: 'path' });
  const [intro, setIntro] = useState<IntroState | null>(null);
  const streak = visibleStreak(progress);

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound]);
  // Declared before app_open so an opted-out learner sends nothing.
  useEffect(() => setAnalyticsEnabled(settings.analytics), [settings.analytics]);

  useEffect(() => {
    if (appOpenSent) return;
    appOpenSent = true;
    track({
      name: 'app_open',
      props: { guest: account.user === null, srsDue: srs.due, lessonsCompleted: lessonsCompleted(progress) },
    });
    // Only the state at launch matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMistake = useCallback(() => update((p) => loseHeart(p)), [update]);
  const noop = useCallback(() => {}, []);
  const closeIntro = useCallback(() => setIntro(null), []);

  function signedIn(res: AuthResponse, mode: AuthMode, from: AuthFrom) {
    account.signIn(res);
    saveSignupPrompt(retire(loadSignupPrompt()));
    if (mode === 'register') track({ name: 'signup_complete', props: { from } });
    identify();
    setScreen({ name: from === 'prompt' ? 'path' : 'profile' });
  }

  if (screen.name === 'auth') {
    const { from } = screen;
    return (
      <AuthScreen
        initialMode={screen.mode}
        onSignedIn={(res, mode) => signedIn(res, mode, from)}
        onCancel={() => setScreen({ name: screen.back === 'onboarding' ? 'path' : screen.back })}
      />
    );
  }

  if (needsOnboarding(progress)) {
    return (
      <Onboarding
        onDone={(goal) => {
          update((p) => setDailyGoal(p, goal));
          track({ name: 'onboarding_complete', props: { dailyGoal: goal } });
        }}
        onSignIn={
          ACCOUNTS_ENABLED
            ? () => setScreen({ name: 'auth', back: 'onboarding', mode: 'login', from: 'onboarding' })
            : undefined
        }
      />
    );
  }

  if (screen.name === 'lesson') {
    const { lessonId, exercises, source } = screen;
    const review = lessonId === null;
    return (
      <LessonScreen
        exercises={exercises}
        lessonId={lessonId}
        hearts={review ? null : progress.hearts}
        onMistake={review ? noop : onMistake}
        onQuit={() => setScreen({ name: 'path' })}
        tip={screen.tip}
        tipTitle={screen.tipTitle}
        boxOf={review ? (key) => srs.store.items[key]?.box : undefined}
        onFinish={(raw) => {
          const durationMs = Math.min(MAX_DURATION_MS, Math.max(0, raw.durationMs));
          if (review) {
            const result = { ...raw, xp: REVIEW_XP };
            const after = completePractice(progress, REVIEW_XP);
            update((p) => completePractice(p, REVIEW_XP));
            // Review XP only reaches the server through a sync; send the updated progress itself.
            void account.sync(after);
            srs.record(result.answers, 'review');
            track({
              name: 'review_complete',
              durationMs,
              props: { size: exercises.length, correct: result.firstTryCorrect },
            });
            setScreen({
              name: 'complete',
              result,
              goalReached: reachesGoal(progress, after),
              kind: source === 'practice' ? 'practice' : 'review',
              signup: null,
            });
            return;
          }
          const after = completeLesson(progress, lessonId, raw.xp);
          update((p) => completeLesson(p, lessonId, raw.xp));
          account.reportLesson(lessonId, { xp: raw.xp, accuracy: raw.accuracy });
          srs.record(raw.answers, 'lesson');
          track({
            name: 'lesson_complete',
            lessonId,
            durationMs,
            props: { accuracy: raw.accuracy, mistakes: raw.mistakes, xp: raw.xp, heartsLeft: progress.hearts },
          });
          const done = lessonsCompleted(after);
          const prompt = loadSignupPrompt();
          const round = signupRound({
            accountsEnabled: ACCOUNTS_ENABLED,
            signedIn: account.user !== null,
            lessonsCompleted: done,
            state: prompt,
          });
          if (round) {
            saveSignupPrompt(markShown(prompt));
            track({ name: 'signup_prompt_shown', props: { lessonsCompleted: done, round } });
          }
          setScreen({
            name: 'complete',
            result: raw,
            goalReached: reachesGoal(progress, after),
            kind: 'lesson',
            signup: round ? { round, lessonsCompleted: done } : null,
          });
        }}
        baseXp={10}
      />
    );
  }

  if (screen.name === 'complete') {
    const { signup } = screen;
    return (
      <LessonComplete
        result={screen.result}
        streak={streak}
        goalReached={screen.goalReached}
        kind={screen.kind}
        onContinue={() => setScreen({ name: 'path' })}
        signupPrompt={
          signup && (
            <SignupPrompt
              onAccept={() => {
                track({ name: 'signup_prompt_accepted', props: { ...signup } });
                setScreen({ name: 'auth', back: 'path', mode: 'register', from: 'prompt' });
              }}
              onDismiss={() => {
                saveSignupPrompt(dismiss(loadSignupPrompt()));
                track({ name: 'signup_prompt_dismissed', props: { ...signup } });
                setScreen({ ...screen, signup: null });
              }}
            />
          )
        }
      />
    );
  }

  function openLesson(lessonId: string) {
    const found = findLesson(lessonId);
    if (!found) return;
    track({
      name: 'lesson_start',
      lessonId,
      props: { catchup: isCatchUp(progress, lessonId), attempt: (progress.completed[lessonId] ?? 0) + 1 },
    });
    setScreen({
      name: 'lesson',
      lessonId,
      exercises: generateExercises(found.lesson),
      tip: found.lesson.tip,
      tipTitle: found.lesson.title,
    });
  }

  function startLesson(lessonId: string) {
    const found = findLesson(lessonId);
    if (!found) return;
    if (shouldAutoShowIntro(found.unit, progress, loadIntroSeen())) {
      track({ name: 'unit_intro_shown', props: { unitId: found.unit.id, trigger: 'auto' } });
      setIntro({ unit: found.unit, trigger: 'auto', lessonId });
      return;
    }
    openLesson(lessonId);
  }

  function showIntro(unit: Unit) {
    track({ name: 'unit_intro_shown', props: { unitId: unit.id, trigger: 'button' } });
    setIntro({ unit, trigger: 'button' });
  }

  function confirmIntro() {
    if (!intro) return;
    setIntro(null);
    if (intro.trigger === 'auto' && intro.lessonId) {
      markIntroSeen(intro.unit.id);
      openLesson(intro.lessonId);
    }
  }

  function startReview() {
    const session = buildReview(srs.store, progress);
    if (session.exercises.length === 0) return;
    track({
      name: 'review_start',
      props: { due: srs.due, size: session.exercises.length, source: session.source },
    });
    setScreen({ name: 'lesson', lessonId: null, exercises: session.exercises, source: session.source });
  }

  const goAuth = () => setScreen({ name: 'auth', back: screen.name, from: 'profile' });

  return (
    <div className="app">
      <TopBar streak={streak} xp={progress.xp} hearts={progress.hearts} />
      <main className="content" key={screen.name}>
        {screen.name === 'path' && (
          <LearningPath
            progress={progress}
            due={srs.due}
            onStart={startLesson}
            onReview={startReview}
            onIntro={showIntro}
          />
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
            onSignIn={ACCOUNTS_ENABLED ? goAuth : undefined}
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
            onClick={() => {
              setIntro(null);
              setScreen({ name: tab.name });
            }}
          >
            <span aria-hidden="true">{tab.icon}</span> <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      {intro && screen.name === 'path' && (
        <UnitIntro unit={intro.unit} trigger={intro.trigger} onConfirm={confirmIntro} onClose={closeIntro} />
      )}
    </div>
  );
}
