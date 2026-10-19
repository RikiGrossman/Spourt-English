import { describe, expect, it } from 'vitest';
import { isNewCall, isPremium, parsePremiumEmails, usageDay } from './premium';

describe('parsePremiumEmails', () => {
  it('splits, trims, lowercases and drops empty entries', () => {
    expect(parsePremiumEmails(' A@Example.com, b@example.com ,,  ,C@X.IO ')).toEqual(
      new Set(['a@example.com', 'b@example.com', 'c@x.io']),
    );
  });

  it('returns an empty set for missing or blank input', () => {
    expect(parsePremiumEmails()).toEqual(new Set());
    expect(parsePremiumEmails('')).toEqual(new Set());
    expect(parsePremiumEmails(' , ')).toEqual(new Set());
  });
});

describe('isPremium', () => {
  const set = parsePremiumEmails('dana@example.com');

  it('matches case-insensitively and ignores surrounding spaces', () => {
    expect(isPremium('dana@example.com', set)).toBe(true);
    expect(isPremium(' Dana@Example.COM ', set)).toBe(true);
  });

  it('rejects other, empty or missing emails', () => {
    expect(isPremium('other@example.com', set)).toBe(false);
    expect(isPremium('', set)).toBe(false);
    expect(isPremium(null, set)).toBe(false);
    expect(isPremium(undefined, set)).toBe(false);
    expect(isPremium('dana@example.com', new Set())).toBe(false);
  });
});

describe('isNewCall', () => {
  it('is true when the history has no learner message', () => {
    expect(isNewCall([])).toBe(true);
    expect(isNewCall([{ role: 'assistant', text: 'Hi!' }])).toBe(true);
    expect(isNewCall(undefined)).toBe(true);
    expect(isNewCall('nope')).toBe(true);
    expect(isNewCall([null, 3])).toBe(true);
  });

  it('is false once the learner has spoken', () => {
    expect(
      isNewCall([
        { role: 'assistant', text: 'Hi!' },
        { role: 'user', text: 'Hello' },
      ]),
    ).toBe(false);
  });
});

describe('usageDay', () => {
  it('uses the given time zone', () => {
    // 22:30 UTC on 1 March is already 2 March in Jerusalem (UTC+2 in winter).
    const t = Date.UTC(2026, 2, 1, 22, 30);
    expect(usageDay(t, 'Asia/Jerusalem')).toBe('2026-03-02');
    expect(usageDay(t, 'UTC')).toBe('2026-03-01');
  });

  it('falls back to the local date as YYYY-MM-DD', () => {
    expect(usageDay(Date.now())).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
