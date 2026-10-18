import type { Unit } from '../../types';

/**
 * Unit 3. Owner: content-a (see docs/spec/v2.md §10 and README.md here).
 * Existing lesson ids keep their place; new lessons are appended at the end of the unit.
 */
export const unit3: Unit = {
  id: 'u3',
  title: 'יחידה 3: אוכל ושתייה',
  description: 'מזמינים, אוהבים ומשלמים',
  color: '#ff9600',
  level: 'A1',
  intro: {
    tip: "לפני צליל תנועה אומרים [[an]]: [[an apple]], [[an egg]]. בבית קפה מבקשים בנימוס עם [[Can I have…?]] או [[I'd like…]] – זה נשמע טבעי יותר מ־[[I want]].",
    goals: ["להזמין אוכל ושתייה", "להגיד מה אני אוהב ומה לא", "לשאול כמה זה עולה"],
  },
  lessons: [
    {
      id: 'u3l1',
      title: 'ארוחת בוקר',
      words: [
        { en: 'water', he: 'מים', sound: 'ווֹטֶר' },
        { en: 'bread', he: 'לחם', sound: 'בּרֶד' },
        { en: 'apple', he: 'תפוח', sound: 'אֶפֶּל' },
        { en: 'milk', he: 'חלב', sound: 'מִילק' },
        { en: 'coffee', he: 'קפה', sound: 'קוֹפִי' },
      ],
      sentences: [
        { en: 'I drink water', he: 'אני שותה מים' },
        { en: 'I eat bread', he: 'אני אוכל לחם' },
        { en: 'Coffee with milk, please', he: 'קפה עם חלב, בבקשה' },
      ],
    },
    {
      id: 'u3l2',
      title: 'אני רעב!',
      words: [
        { en: 'rice', he: 'אורז', sound: 'רַייס' },
        { en: 'chicken', he: 'עוף', sound: 'צִ׳יקֶן' },
        { en: 'egg', he: 'ביצה', sound: 'אֶג' },
        { en: 'tea', he: 'תה', sound: 'טִי' },
        { en: 'hungry', he: 'רעב', sound: 'הָאנגרִי' },
      ],
      sentences: [
        { en: 'I am hungry', he: 'אני רעב', alt: ["I'm hungry"] },
        { en: 'I eat an egg', he: 'אני אוכל ביצה' },
        { en: 'Tea or coffee?', he: 'תה או קפה?' },
        { en: 'I want rice and chicken', he: 'אני רוצה אורז ועוף' },
      ],
    },
  ],
};
