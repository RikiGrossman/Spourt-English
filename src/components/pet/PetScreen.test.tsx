import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { adoptPet, growPet } from '../../lib/pet';
import { MemberPet } from '../MyGroups';
import { PetScreen } from './PetScreen';

const noop = () => {};
const base = {
  xp: 0,
  streak: 0,
  practicedToday: false,
  today: '2026-10-22',
  premium: false,
  canDesignWithAi: false,
  onAdopt: noop,
  onToggleAccessory: noop,
  onDesign: noop,
};

describe('PetScreen', () => {
  it('offers to adopt a pet first', () => {
    const html = renderToStaticMarkup(<PetScreen {...base} pet={null} />);
    expect(html).toContain('בחרו חיה שתלווה אתכם');
    expect(html).toContain('דרקון');
  });

  it('shows the egg before the first lesson', () => {
    const html = renderToStaticMarkup(<PetScreen {...base} pet={adoptPet('owl', 'חכמה')} />);
    expect(html).toContain('חכמה');
    expect(html).toContain('אני עוד בביצה');
  });

  it('shows the challenge, accessories and abilities as the pet grows', () => {
    const pet = growPet(adoptPet('dragon', 'שלהבת')!, { xp: 250, lessons: 3, streak: 3 }).pet;
    const html = renderToStaticMarkup(<PetScreen {...base} xp={250} streak={3} pet={pet} />);
    expect(html).toContain('האתגר של היום');
    expect(html).toContain('צעיף');
    expect(html).toContain('🧢');
    expect(html).toContain('שתפו את שלהבת');
  });

  it('locks the designer for non-premium learners and opens it for premium', () => {
    const pet = adoptPet('dragon', 'שלהבת');
    expect(renderToStaticMarkup(<PetScreen {...base} pet={pet} onPremium={noop} />)).toContain('לפרטים על פרימיום');
    expect(renderToStaticMarkup(<PetScreen {...base} pet={pet} premium />)).toContain('לעצב חיה ייחודית');
  });
});

describe('MemberPet', () => {
  it("shows a member's pet with what it wears", () => {
    const html = renderToStaticMarkup(
      <MemberPet pet={{ name: 'שלהבת', emoji: '🐲', stage: 2, color: '#4caf50', worn: ['🧢'] }} />,
    );
    expect(html).toContain('🐲');
    expect(html).toContain('🧢');
    expect(html).toContain('החיה שלהבת');
  });
});
