import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('falls back to defaults for missing or broken data', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{oops')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{"theme":"neon","sound":"yes","analytics":"no"}')).toEqual(DEFAULT_SETTINGS);
  });

  it('reads saved choices', () => {
    expect(parseSettings('{"theme":"dark","sound":false,"analytics":false,"speaking":false}')).toEqual({
      theme: 'dark',
      sound: false,
      analytics: false,
      speaking: false,
    });
  });

  it('turns analytics and speaking on for saves from before those settings existed', () => {
    expect(DEFAULT_SETTINGS.analytics).toBe(true);
    expect(DEFAULT_SETTINGS.speaking).toBe(true);
    expect(parseSettings('{"theme":"dark","sound":false}')).toEqual({
      theme: 'dark',
      sound: false,
      analytics: true,
      speaking: true,
    });
  });
});
