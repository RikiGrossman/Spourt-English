import { useCallback, useEffect, useState } from 'react';
import { MAX_DURATION_MS } from '../shared/analytics';
import type { AuthResponse } from '../shared/api';
import type { CallStatusResponse, Persona } from '../shared/call';
import { REVIEW_XP } from '../shared/srs';
import { course, findLesson } from './data/course';
import { AuthScreen, type Mode as AuthMode } from './components/AuthScreen';
import { CallPicker } from './components/call/CallPicker';
import { CallScreen } from './components/call/CallScreen';
import { CallSummary, type CallResult } from './components/call/CallSummary';
import { LearningPath } from './components/LearningPath';
import { Leaderboard } from './components/Leaderboard';
import { LessonComplete } from './components/LessonComplete';
import { LessonScreen, type LessonResult } from './components/LessonScreen';
import { Onboarding } from './components/Onboarding';
import { Profile } from './components/Profile';
import { SignupPrompt } from './components/SignupPrompt';
import { TopBar } from './components/TopBar';
import { UnitIntro } from './components/UnitIntro';
import { UpdatePrompt } from './components/UpdatePrompt';
import { useAccount } from './lib/account';
import { identify, setAnalyticsEnabled, track } from './lib/analytics';
import { CALLS_ENABLED, getCallStatus } from './lib/call-api';
import { ACCOUNTS_ENABLED } from './lib/config';
import { generateExercises, withoutSpeaking } from './lib/exercises';
import { canListen } from './lib/listen';
import { needsOnboarding, reachesGoal, setDailyGoal } from './lib/goals';
import { loadIntroSeen, markIntroSeen, shouldAutoShowIntro } from './lib/intro-seen';
import { completePractice } from './lib/practice';
import {
  applyStreakFreeze,
  avatarEmoji,
  buy,
  chooseAvatar,
  openChest,
  rewardActivity,
  rewardUnitTest,
  useGems,
  type GameId,
  type Reward,
} from './lib/gems';
import { DailyRewards } from './components/DailyRewards';
import { Shop } from './components/Shop';
import { Arcade } from './components/Arcade';
import { GameResult } from './components/games/GameResult';
import { MemoryGame } from './components/games/MemoryGame';
import { WordRush } from './components/games/WordRush';
import { finishGame, gameInfo, gameUnlocked, unlockGame, wordPool } from './lib/games';
import { completeLesson, dateKey, isCatchUp, loseHeart, resetProgress, visibleStreak } from './lib/progress';
import { syncReminders } from './lib/reminders';
import { applyPlacement, placementDone, placementQuestions, unitsPassed } from './lib/placement';
import { QuizScreen } from './components/QuizScreen';
import { PlacementResult } from './components/PlacementResult';
import { UnitTestResult } from './components/UnitTestResult';
import { applyUnitTest, unitTestPassed, unitTestQuestions, unitTestScore } from './lib/unit-test';
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
import { setSoundEnabled, sounds } from './lib/sound';
import { useSettings } from './lib/settings';
import { useSrs } from './lib/srs';
import { useProgress } from './lib/store';
import { useAppUpdate } from './lib/update';
import type { Exercise, Unit } from './types';

type Tab = 'path' | 'shop' | 'league' | 'call' | 'profile';

/** The arcade is opened from the path, so it isn't a tab. */
type Page = Tab | 'arcade';

/** Where a sign-up started, reported with `signup_complete`. */
type AuthFrom = 'prompt' | 'profile' | 'onboarding';

type Screen =
  | { name: Page }
  /** An arcade game; `round` remounts it for "another round". */
  | { name: 'game'; game: GameId; round: number }
  | { name: 'game-done'; game: GameId; score: number; record: boolean; rewards: Reward[] }
  | { name: 'placement'; exercises: Exercise[] }
  | { name: 'placement-done'; units: number }
  | { name: 'unit-test'; unit: Unit; exercises: Exercise[] }
  | { name: 'unit-test-done'; unit: Unit; right: number; passed: boolean; rewards: Reward[] }
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
      rewards: Reward[];
      signup: { round: SignupRound; lessonsCompleted: number } | null;
    }
  /** An AI video call in progress, and its summary after hanging up. */
  | { name: 'call-active'; persona: Persona }
  | { name: 'call-summary'; result: CallResult };

interface IntroState {
  unit: Unit;
  trigger: 'auto' | 'button';
  /** The lesson to open after "יאללה, מתחילים" (auto only). */
  lessonId?: string;
}

const ALL_TABS: { name: Tab; icon: string; label: string }[] = [
  { name: 'path', icon: '🏠', label: 'לימוד' },
  { name: 'shop', icon: '💎', label: 'חנות' },
  { name: 'league', icon: '🏆', label: 'ליגה' },
  { name: 'call', icon: '📞', label: 'שיחה' },
  { name: 'profile', icon: '👤', label: 'פרופיל' },
];

// The league and AI calls need a backend, so static deploys without one leave them out.
const TABS = ALL_TABS.filter(
  (tab) => (tab.name !== 'league' || ACCOUNTS_ENABLED) && (tab.name !== 'call' || CALLS_ENABLED),
);

/** `app_open` is sent once per launch (StrictMode mounts effects twice in development). */
let appOpenSent = false;

export default function App() {
  const update = useAppUpdate();
  return (
    <>
      <Screens />
      <UpdatePrompt state={update.state} onInstall={() => void update.install()} onDismiss={update.dismiss} />
    </>
  );
}

function Screens() {
  const { progress, update, reset } = useProgress();
  const { settings, change: changeSettings } = useSettings();
  const account = useAccount(progress, update);
  const srs = useSrs(progress, account.user !== null);
  const { gems, update: updateGems, reset: resetGems } = useGems();
  /** Days a streak freeze covered since the app opened (shown once on the path). */
  const [frozeDays, setFrozeDays] = useState(0);
  const [screen, setScreen] = useState<Screen>({ name: 'path' });
  const [intro, setIntro] = useState<IntroState | null>(null);
  /** Premium and today's call count, as last heard from the server (the call tab refreshes it). */
  const [callStatus, setCallStatus] = useState<CallStatusResponse | null>(null);
  const streak = visibleStreak(progress);

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound]);
  // Declared before app_open so an opted-out learner sends nothing.
  useEffect(() => setAnalyticsEnabled(settings.analytics), [settings.analytics]);

  // Reschedule the week of Android reminders on launch, on settings changes and after practice,
  // so a day that was already practised gets no reminder.
  const practicedToday = progress.lastActiveDate === dateKey(Date.now());
  useEffect(() => {
    void syncReminders({ enabled: settings.reminder, time: settings.reminderTime, practicedToday, streak });
  }, [settings.reminder, settings.reminderTime, practicedToday, streak]);

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

  // A missed day is covered by a streak freeze bought with gems, so the streak survives.
  const today = dateKey(Date.now());
  useEffect(() => {
    const frozen = applyStreakFreeze(progress, gems.freezes);
    if (!frozen) return;
    update(() => frozen.progress);
    updateGems((s) => ({ ...s, freezes: Math.max(0, s.freezes - frozen.used) }));
    setFrozeDays((n) => n + frozen.used);
    void account.sync(frozen.progress);
    // Only a change of the last active day (or of the date) can call for a freeze.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.lastActiveDate, gems.freezes, today]);

  // Bonus hearts (from the gem shop) are spent before the regular ones.
  const bonusHearts = gems.bonusHearts;
  const onMistake = useCallback(() => {
    if (bonusHearts > 0) updateGems((s) => ({ ...s, bonusHearts: Math.max(0, s.bonusHearts - 1) }));
    else update((p) => loseHeart(p));
  }, [update, updateGems, bonusHearts]);
  const noop = useCallback(() => {}, []);
  const closeIntro = useCallback(() => setIntro(null), []);
  const onCallsToday = useCallback((callsToday: number) => setCallStatus((s) => (s ? { ...s, callsToday } : s)), []);

  // Another learner may sign in on this device: forget the last one's call status, then ask the
  // server again so the premium badge shows without opening the call tab first.
  const userId = account.user?.id ?? null;
  useEffect(() => {
    setCallStatus(null);
    if (!userId || !CALLS_ENABLED) return;
    const controller = new AbortController();
    getCallStatus(controller.signal).then(
      (res) => {
        if (!controller.signal.aborted) setCallStatus(res);
      },
      () => {}, // Offline or signed out: no badge until the call tab or a sign-in tries again.
    );
    return () => controller.abort();
  }, [userId]);
  const premium = account.user !== null && callStatus?.premium === true;

  function signedIn(res: AuthResponse, mode: AuthMode, from: AuthFrom, back: Tab | 'onboarding') {
    account.signIn(res);
    saveSignupPrompt(retire(loadSignupPrompt()));
    if (mode === 'register') track({ name: 'signup_complete', props: { from } });
    identify();
    // Signing in from the call tab goes back to the characters.
    setScreen({ name: from === 'prompt' ? 'path' : back === 'call' ? 'call' : 'profile' });
  }

  if (screen.name === 'auth') {
    const { from, back } = screen;
    return (
      <AuthScreen
        initialMode={screen.mode}
        onSignedIn={(res, mode) => signedIn(res, mode, from, back)}
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
        hearts={review ? null : progress.hearts + gems.bonusHearts}
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
            const kind = source === 'practice' ? 'practice' : 'review';
            const goalReached = reachesGoal(progress, after);
            const earned = rewardActivity(gems, { kind, flawless: raw.mistakes === 0, goalReached });
            updateGems(() => earned.state);
            track({
              name: 'review_complete',
              durationMs,
              props: { size: exercises.length, correct: result.firstTryCorrect },
            });
            setScreen({
              name: 'complete',
              result,
              goalReached,
              kind,
              rewards: earned.rewards,
              signup: null,
            });
            return;
          }
          const after = completeLesson(progress, lessonId, raw.xp);
          update((p) => completeLesson(p, lessonId, raw.xp));
          account.reportLesson(lessonId, { xp: raw.xp, accuracy: raw.accuracy });
          srs.record(raw.answers, 'lesson');
          const goalReached = reachesGoal(progress, after);
          const earned = rewardActivity(gems, { kind: 'lesson', flawless: raw.mistakes === 0, goalReached });
          updateGems(() => earned.state);
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
            goalReached,
            kind: 'lesson',
            rewards: earned.rewards,
            signup: round ? { round, lessonsCompleted: done } : null,
          });
        }}
        baseXp={10}
      />
    );
  }

  if (screen.name === 'placement') {
    return (
      <QuizScreen
        badge="🎯 מבחן מיקום"
        exercises={screen.exercises}
        stop={placementDone}
        onQuit={() => setScreen({ name: 'path' })}
        onFinish={(answers) => {
          const units = unitsPassed(answers);
          if (units > 0) {
            const after = applyPlacement(progress, units);
            update((p) => applyPlacement(p, units));
            void account.sync(after);
          }
          setScreen({ name: 'placement-done', units });
        }}
      />
    );
  }

  if (screen.name === 'placement-done') {
    return <PlacementResult units={screen.units} onContinue={() => setScreen({ name: 'path' })} />;
  }

  if (screen.name === 'unit-test') {
    const { unit } = screen;
    return (
      <QuizScreen
        badge="🏆 מבחן יחידה"
        exercises={screen.exercises}
        onQuit={() => setScreen({ name: 'path' })}
        onFinish={(answers) => {
          const { right, passed } = unitTestScore(answers);
          let rewards: Reward[] = [];
          if (passed && !unitTestPassed(progress, unit)) {
            const earned = rewardUnitTest(gems);
            updateGems(() => earned.state);
            rewards = earned.rewards;
          }
          if (passed) {
            const after = applyUnitTest(progress, unit);
            update((p) => applyUnitTest(p, unit));
            void account.sync(after);
          }
          setScreen({ name: 'unit-test-done', unit, right, passed, rewards });
        }}
      />
    );
  }

  if (screen.name === 'unit-test-done') {
    return (
      <UnitTestResult
        unit={screen.unit}
        right={screen.right}
        passed={screen.passed}
        rewards={screen.rewards}
        onRetry={() => startUnitTest(screen.unit)}
        onContinue={() => setScreen({ name: 'path' })}
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
        rewards={screen.rewards}
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

  if (screen.name === 'game') {
    const { game, round } = screen;
    const Game = game === 'rush' ? WordRush : MemoryGame;
    return (
      <Game
        key={round}
        pool={wordPool(progress)}
        onQuit={() => setScreen({ name: 'arcade' })}
        onFinish={(score) => {
          const done = finishGame(gems, game, score);
          updateGems(() => done.state);
          if (done.rewards.length) sounds.gem();
          setScreen({ name: 'game-done', game, score, record: done.record, rewards: done.rewards });
        }}
      />
    );
  }

  if (screen.name === 'game-done') {
    return (
      <GameResult
        title={gameInfo(screen.game).title}
        score={screen.score}
        best={gems.games.best[screen.game]}
        record={screen.record}
        rewards={screen.rewards}
        onAgain={() => setScreen({ name: 'game', game: screen.game, round: Date.now() })}
        onBack={() => setScreen({ name: 'arcade' })}
      />
    );
  }

  if (screen.name === 'call-active') {
    return (
      <CallScreen
        key={screen.persona.id}
        persona={screen.persona}
        onEnd={(result) => setScreen({ name: 'call-summary', result })}
        onBack={() => setScreen({ name: 'call' })}
        onCallsToday={onCallsToday}
        onBlocked={(error) => {
          if (error.status === 401) setCallStatus(null);
          else
            setCallStatus(
              (s) => s && (error.status === 403 ? { ...s, premium: false } : { ...s, callsToday: s.callsPerDay }),
            );
        }}
      />
    );
  }

  if (screen.name === 'call-summary') {
    return (
      <CallSummary
        result={screen.result}
        onNewCall={() => setScreen({ name: 'call' })}
        onBack={() => setScreen({ name: 'path' })}
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
      exercises:
        canListen && settings.speaking
          ? generateExercises(found.lesson)
          : withoutSpeaking(generateExercises(found.lesson)),
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

  function startUnitTest(unit: Unit) {
    setScreen({ name: 'unit-test', unit, exercises: unitTestQuestions(unit, course.indexOf(unit)) });
  }

  const goAuth = () =>
    setScreen({ name: 'auth', back: screen.name === 'arcade' ? 'path' : screen.name, from: 'profile' });
  const goShop = () => {
    setIntro(null);
    setScreen({ name: 'shop' });
  };

  function spend(next: typeof gems | null) {
    if (!next) return;
    sounds.gem();
    updateGems(() => next);
  }

  return (
    <div className="app">
      <TopBar
        streak={streak}
        xp={progress.xp}
        hearts={progress.hearts + gems.bonusHearts}
        gems={gems.gems}
        onGems={goShop}
        premium={premium}
      />
      <main className="content" key={screen.name}>
        {screen.name === 'path' && frozeDays > 0 && (
          <p className="freeze-banner pop" role="status">
            🧊 הקפאת רצף שמרה על הרצף שלכם ({frozeDays === 1 ? 'יום אחד' : `${frozeDays} ימים`}). עכשיו תורכם!
          </p>
        )}
        {screen.name === 'path' && (
          <DailyRewards
            gems={gems}
            today={today}
            onOpenChest={() => {
              const opened = openChest(gems);
              if (!opened) return null;
              sounds.gem();
              updateGems(() => opened.state);
              return opened.amount;
            }}
          />
        )}
        {screen.name === 'path' && (
          <button type="button" className="arcade-card" onClick={() => setScreen({ name: 'arcade' })}>
            <span className="arcade-card-icon" aria-hidden="true">
              🎮
            </span>
            <span className="arcade-card-text">
              <strong>ארקייד</strong>
              <span className="muted">משחקי מילים שנפתחים בהתקדמות וביהלומים</span>
            </span>
            <span className="arcade-card-go" aria-hidden="true">
              ‹
            </span>
          </button>
        )}
        {screen.name === 'arcade' && (
          <Arcade
            gems={gems}
            progress={progress}
            today={today}
            onPlay={(game) => {
              if (gameUnlocked(gems, progress, game)) setScreen({ name: 'game', game, round: 0 });
            }}
            onUnlock={(game) => spend(unlockGame(gems, game))}
          />
        )}
        {screen.name === 'shop' && (
          <Shop gems={gems} onBuy={(id) => spend(buy(gems, id))} onAvatar={(id) => spend(chooseAvatar(gems, id))} />
        )}
        {screen.name === 'path' && (
          <LearningPath
            progress={progress}
            due={srs.due}
            onStart={startLesson}
            onReview={startReview}
            onIntro={showIntro}
            onPlacement={() => setScreen({ name: 'placement', exercises: placementQuestions() })}
            onUnitTest={startUnitTest}
          />
        )}
        {screen.name === 'league' && <Leaderboard user={account.user} onSignIn={goAuth} />}
        {screen.name === 'call' && (
          <CallPicker
            user={account.user}
            status={callStatus}
            onStatus={setCallStatus}
            onSignIn={goAuth}
            onCall={(persona) => setScreen({ name: 'call-active', persona })}
          />
        )}
        {screen.name === 'profile' && (
          <Profile
            progress={progress}
            streak={streak}
            user={account.user}
            premium={premium}
            syncStatus={account.status}
            settings={settings}
            onSettings={changeSettings}
            onGoal={(xp) => update((p) => setDailyGoal(p, xp))}
            onSignIn={ACCOUNTS_ENABLED ? goAuth : undefined}
            onSignOut={account.signOut}
            onDeleteAccount={account.deleteAccount}
            onSync={() => void account.sync()}
            avatar={avatarEmoji(gems)}
            gems={gems.gems}
            onShop={goShop}
            onReset={() => {
              srs.reset();
              resetGems();
              if (account.user) {
                // Signed in: the reset is marked with its time so it wins over every older copy –
                // on the server and on the learner's other devices.
                const fresh = resetProgress(progress);
                update(() => fresh);
                void account.sync(fresh);
              } else {
                reset();
              }
            }}
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
