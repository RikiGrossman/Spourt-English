import { describe, expect, it } from 'vitest';
import {
  EVOLVE_GEMS,
  STAGES,
  adoptPet,
  applyDesign,
  greetingLine,
  growPet,
  parsePet,
  petLook,
  petReminderText,
  reactionLine,
  recordChallenge,
  shareText,
  stageFor,
  todaysChallenge,
  toggleAccessory,
  xpToNextStage,
  type PetState,
} from './pet';

const TODAY = '2026-10-22';
const pet = (): PetState => adoptPet('dragon', 'שלהבת', 0)!;
const quiet = {
  kind: 'lesson' as const,
  flawless: false,
  goalReached: false,
  evolvedTo: null,
  newAccessories: [],
  challenge: null,
};

describe('adoptPet', () => {
  it('adopts a known species, falling back to its name', () => {
    expect(adoptPet('owl', '  ')!.name).toBe('ינשוף');
    expect(adoptPet('dragon', 'שלהבת')!.name).toBe('שלהבת');
    expect(adoptPet('nope', 'x')).toBeNull();
  });
});

describe('stages', () => {
  it('starts as an egg, hatches with the first lesson and evolves with XP', () => {
    expect(stageFor(0)).toBe(0);
    expect(stageFor(10)).toBe(1);
    expect(stageFor(199)).toBe(1);
    expect(stageFor(STAGES[4].xp)).toBe(4);
    expect(petLook(pet(), 0).emoji).toBe('🥚');
    expect(petLook(pet(), 10).emoji).toBe('🦎');
    expect(petLook(pet(), 600).emoji).toBe('🐉');
  });

  it('tells how far the next stage is', () => {
    expect(xpToNextStage(100)).toMatchObject({ remaining: 100, next: { name: STAGES[2].name } });
    expect(xpToNextStage(5000)).toBeNull();
  });
});

describe('growPet', () => {
  it('pays for every stage reached since last seen and grants accessories once', () => {
    const grown = growPet(pet(), { xp: 250, lessons: 1, streak: 3 });
    expect(grown.evolvedTo).toBe(2);
    expect(grown.gems).toBe(EVOLVE_GEMS * 1 + EVOLVE_GEMS * 2);
    expect(grown.newAccessories.map((a) => a.id)).toEqual(['scarf', 'cap']);
    expect(grown.pet.worn).toEqual({ neck: 'scarf', head: 'cap' });
    const again = growPet(grown.pet, { xp: 250, lessons: 1, streak: 0 });
    expect(again.pet).toBe(grown.pet);
    expect(again.gems).toBe(0);
    // Earned accessories stay even after the streak is lost.
    expect(again.pet.accessories).toContain('cap');
  });

  it("doesn't replace an accessory that is already worn", () => {
    const first = growPet(pet(), { xp: 10, lessons: 1, streak: 3 }).pet;
    const later = growPet(first, { xp: 10, lessons: 1, streak: 7 }).pet;
    expect(later.accessories).toContain('bow');
    expect(later.worn.head).toBe('cap');
  });
});

describe('toggleAccessory', () => {
  it('wears and removes earned accessories only', () => {
    const p = growPet(pet(), { xp: 10, lessons: 1, streak: 7 }).pet;
    expect(toggleAccessory(p, 'bow').worn.head).toBe('bow');
    expect(toggleAccessory(p, 'cap').worn.head).toBeUndefined();
    expect(toggleAccessory(p, 'crown')).toBe(p);
  });
});

describe('recordChallenge', () => {
  it('has no challenge before stage 2', () => {
    const r = recordChallenge(pet(), { kind: 'lesson', flawless: true, xpToday: 100 }, 50, TODAY);
    expect(r.gems).toBe(0);
    expect(r.pet.challengeDate).toBeNull();
  });

  it('pays once when the challenge is done, and starts over the next day', () => {
    const challenge = todaysChallenge(TODAY);
    let p = pet();
    let paid = 0;
    for (let i = 0; i < 5; i++) {
      const activity =
        challenge.kind === 'review'
          ? { kind: 'review' as const, flawless: true, xpToday: 30 }
          : { kind: 'lesson' as const, flawless: true, xpToday: 30 * (i + 1) };
      const r = recordChallenge(p, activity, 300, TODAY);
      p = r.pet;
      paid += r.gems;
    }
    expect(paid).toBe(challenge.gems);
    expect(p.challengeClaimed).toBe(true);
    const tomorrow = recordChallenge(p, { kind: 'lesson', flawless: false, xpToday: 0 }, 300, '2026-10-23');
    expect(tomorrow.pet.challengeDate).toBe('2026-10-23');
  });

  it('doubles the reward with the legendary aura', () => {
    const challenge = todaysChallenge(TODAY);
    let p = pet();
    let paid = 0;
    for (let i = 0; i < 5; i++) {
      const r = recordChallenge(
        p,
        { kind: challenge.kind === 'review' ? 'review' : 'lesson', flawless: true, xpToday: 100 },
        2000,
        TODAY,
      );
      p = r.pet;
      paid += r.gems;
    }
    expect(paid).toBe(challenge.gems * 2);
  });
});

describe('what the pet says', () => {
  it('announces evolution first', () => {
    expect(reactionLine(pet(), { ...quiet, evolvedTo: 2, goalReached: true })).toContain(STAGES[2].name);
  });

  it('speaks in its personality', () => {
    expect(reactionLine(pet(), { ...quiet, flawless: true }, 0)).toBe('שיעור מושלם! אלופים! 🏆');
  });

  it('mentions the streak in the greeting', () => {
    expect(greetingLine(pet(), false, 4)).toContain('4 ימים');
  });

  it('signs the reminders', () => {
    expect(petReminderText({ name: 'שלהבת', emoji: '🐲' }, 5, 0).title).toContain('שלהבת');
    expect(petReminderText({ name: 'שלהבת', emoji: '🐲' }, 0, 0).body).not.toBe(
      petReminderText({ name: 'שלהבת', emoji: '🐲' }, 0, 1).body,
    );
  });

  it('writes a text to share', () => {
    expect(shareText(pet(), 250, 3)).toContain('שלהבת');
  });
});

describe('premium design', () => {
  const design = {
    name: 'זוהר',
    base: '🦊',
    color: 'lilac',
    traits: ['stars'],
    personality: 'funny' as const,
    bio: '',
  };

  it('replaces the look and can be switched back', () => {
    const custom = applyDesign(pet(), design);
    expect(custom.name).toBe('זוהר');
    expect(petLook(custom, 100)).toMatchObject({ emoji: '🦊', traits: ['⭐'] });
    expect(petLook(applyDesign(custom, null), 100).emoji).toBe('🦎');
  });
});

describe('parsePet', () => {
  it('round-trips and drops anything unknown', () => {
    const p = growPet(pet(), { xp: 10, lessons: 1, streak: 0 }).pet;
    expect(parsePet(JSON.stringify(p))).toEqual(p);
    const bad = { ...p, accessories: ['scarf', 'laser'], worn: { head: 'scarf', neck: 'laser' } };
    expect(parsePet(JSON.stringify(bad))).toMatchObject({ accessories: ['scarf'], worn: {} });
    expect(parsePet('{"species":"nope"}')).toBeNull();
    expect(parsePet('not json')).toBeNull();
    expect(parsePet(null)).toBeNull();
  });
});
