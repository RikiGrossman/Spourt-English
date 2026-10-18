import { describe, expect, it } from 'vitest';
import { validateAuth } from './AuthScreen';
import { lessonResult } from './LessonScreen';

describe('lessonResult', () => {
  it('gives a bonus for a flawless lesson', () => {
    expect(lessonResult(10, 0)).toEqual({ xp: 15, accuracy: 100 });
    expect(lessonResult(10, 5)).toEqual({ xp: 10, accuracy: 67 });
    expect(lessonResult(10, 0, 20).xp).toBe(25);
  });
});

describe('validateAuth', () => {
  it('checks the form fields', () => {
    expect(validateAuth('register', 'a@b.co', '12345678', 'רון')).toBeNull();
    expect(validateAuth('register', 'a@b.co', '12345678', 'ר')).not.toBeNull();
    expect(validateAuth('register', 'not-an-email', '12345678', 'רון')).not.toBeNull();
    expect(validateAuth('register', 'a@b.co', '123', 'רון')).not.toBeNull();
    expect(validateAuth('login', 'a@b.co', '1', '')).toBeNull();
    expect(validateAuth('login', 'a@b.co', '', '')).not.toBeNull();
  });

  // Regression: the form accepted 6–7 character passwords that the server rejects (US-A1 AC1/AC3).
  it('requires the same 8-character minimum as the server', () => {
    expect(validateAuth('register', 'a@b.co', '1234567', 'רון')).toMatch(/8/);
    expect(validateAuth('register', 'a@b.co', '12345678', 'רון')).toBeNull();
  });
});
