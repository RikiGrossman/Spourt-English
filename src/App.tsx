import { useCallback, useState } from 'react';
import { findLesson } from './data/course';
import { LearningPath } from './components/LearningPath';
import { LessonComplete } from './components/LessonComplete';
import { LessonScreen, type LessonResult } from './components/LessonScreen';
import { Profile } from './components/Profile';
import { TopBar } from './components/TopBar';
import { completeLesson, loseHeart, visibleStreak } from './lib/progress';
import { useProgress } from './lib/store';

type Screen =
  | { name: 'path' }
  | { name: 'profile' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'complete'; result: LessonResult };

export default function App() {
  const { progress, update, reset } = useProgress();
  const [screen, setScreen] = useState<Screen>({ name: 'path' });
  const streak = visibleStreak(progress);

  const onMistake = useCallback(() => update((p) => loseHeart(p)), [update]);

  if (screen.name === 'lesson') {
    const found = findLesson(screen.lessonId);
    if (!found) return null;
    return (
      <LessonScreen
        lesson={found.lesson}
        hearts={progress.hearts}
        onMistake={onMistake}
        onQuit={() => setScreen({ name: 'path' })}
        onFinish={(result) => {
          update((p) => completeLesson(p, screen.lessonId, result.xp));
          setScreen({ name: 'complete', result });
        }}
      />
    );
  }

  if (screen.name === 'complete') {
    return <LessonComplete result={screen.result} streak={streak} onContinue={() => setScreen({ name: 'path' })} />;
  }

  return (
    <div className="app">
      <TopBar streak={streak} xp={progress.xp} hearts={progress.hearts} />
      <main className="content">
        {screen.name === 'path' ? (
          <LearningPath progress={progress} onStart={(lessonId) => setScreen({ name: 'lesson', lessonId })} />
        ) : (
          <Profile progress={progress} streak={streak} onReset={reset} />
        )}
      </main>
      <nav className="bottom-nav">
        <button type="button" className={screen.name === 'path' ? 'active' : ''} onClick={() => setScreen({ name: 'path' })}>
          🏠 <span>לימוד</span>
        </button>
        <button
          type="button"
          className={screen.name === 'profile' ? 'active' : ''}
          onClick={() => setScreen({ name: 'profile' })}
        >
          👤 <span>פרופיל</span>
        </button>
      </nav>
    </div>
  );
}
