import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { initialGems, openChest } from '../lib/gems';
import { DailyRewards } from './DailyRewards';
import { LessonScreen } from './LessonScreen';

const noop = () => {};
const watch = async () => true;

function outOfHearts(onWatchAd?: () => Promise<boolean>) {
  return renderToStaticMarkup(
    <LessonScreen
      exercises={[]}
      lessonId="u1-l1"
      hearts={0}
      onMistake={noop}
      onFinish={noop}
      onQuit={noop}
      onWatchAd={onWatchAd}
    />,
  );
}

describe('rewarded videos in the app', () => {
  it('offers a video for a heart only when ads are on', () => {
    expect(outOfHearts(watch)).toContain('צפו בסרטון קצר וקבלו לב');
    expect(outOfHearts()).not.toContain('צפו בסרטון');
    expect(outOfHearts()).toContain('חזרה למסלול');
  });

  it('never shows a video offer on the closed chest', () => {
    const today = '2026-10-20';
    const html = renderToStaticMarkup(
      <DailyRewards gems={initialGems()} today={today} onOpenChest={() => 5} onDoubleChest={watch} />,
    );
    expect(html).not.toContain('הכפילו');
    // Opened earlier today (not in this visit): nothing to double from here.
    const opened = openChest(initialGems(), () => 0, today)!.state;
    expect(
      renderToStaticMarkup(<DailyRewards gems={opened} today={today} onOpenChest={() => null} onDoubleChest={watch} />),
    ).not.toContain('הכפילו');
  });
});
