import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('falls back to defaults for missing or broken data', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{oops')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{"theme":"neon","sound":"yes"}')).toEqual(DEFAULT_SETTINGS);
  });

  it('reads saved choices', () => {
    expect(parseSettings('{"theme":"dark","sound":false}')).toEqual({ theme: 'dark', sound: false });
  });
});
