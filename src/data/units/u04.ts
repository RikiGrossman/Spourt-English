import type { Unit } from '../../types';

/**
 * Unit 4. Owner: content-b (see docs/spec/v2.md §10 and README.md here).
 * Existing lesson ids keep their place; new lessons are appended at the end of the unit.
 */
export const unit4: Unit = {
  id: 'u4',
  title: 'יחידה 4: מספרים, צבעים וזמן',
  description: 'סופרים עד 100, צבעים, שעות וימים',
  color: '#ce82ff',
  level: 'A1',
  intro: {
    tip: "אחרי מספר גדול מאחד מוסיפים [[s]]: [[two brothers]]. גיל אומרים עם [[am / is]]: [[I am ten]]. שעה עם [[at]], יום עם [[on]], חודש עם [[in]]: [[at seven]], [[on Sunday]], [[in July]].",
    goals: ["לספור עד 100", "לתאר צבעים", "להגיד שעה, יום ותאריך"],
  },
  lessons: [
    {
      id: 'u4l1',
      title: 'אחת, שתיים, שלוש',
      words: [
        { en: 'one', he: 'אחת', sound: 'וָואן' },
        { en: 'two', he: 'שתיים', sound: 'טוּ' },
        { en: 'three', he: 'שלוש', sound: 'ת׳רִי' },
        { en: 'four', he: 'ארבע', sound: 'פוֹר' },
        { en: 'five', he: 'חמש', sound: 'פַייב' },
      ],
      sentences: [
        { en: 'One coffee, please', he: 'קפה אחד, בבקשה' },
        { en: 'I have two brothers', he: 'יש לי שני אחים' },
        { en: 'I have three apples', he: 'יש לי שלושה תפוחים' },
        { en: 'Four and one is five', he: 'ארבע ועוד אחת זה חמש', alt: ['Four plus one is five', 'Four and one are five'] },
      ],
    },
    {
      id: 'u4l2',
      title: 'בן כמה אתה?',
      words: [
        { en: 'six', he: 'שש', sound: 'סִיקס' },
        { en: 'seven', he: 'שבע', sound: 'סֶבֶן' },
        { en: 'eight', he: 'שמונה', sound: 'אֵייט' },
        { en: 'nine', he: 'תשע', sound: 'נַיין' },
        { en: 'ten', he: 'עשר', sound: 'טֶן' },
      ],
      sentences: [
        { en: 'How old are you?', he: 'בן כמה אתה?' },
        { en: 'I am ten years old', he: 'אני בן עשר', alt: ["I'm ten years old", 'I am ten', "I'm ten"] },
        { en: 'She is eight years old', he: 'היא בת שמונה', alt: ["She's eight years old", 'She is eight', "She's eight"] },
        { en: 'My brother is seven', he: 'אחי בן שבע', alt: ['My brother is seven years old', "My brother's seven"] },
      ],
    },
    {
      id: 'u4l3',
      title: 'צבעים',
      words: [
        { en: 'red', he: 'אדום', sound: 'רֶד' },
        { en: 'blue', he: 'כחול', sound: 'בּלוּ' },
        { en: 'green', he: 'ירוק', sound: 'גרִין' },
        { en: 'yellow', he: 'צהוב', sound: 'יֶלוֹ' },
        { en: 'black', he: 'שחור', sound: 'בּלֶק' },
      ],
      sentences: [
        { en: 'The apple is red', he: 'התפוח אדום', alt: ["The apple's red"] },
        { en: 'I have a blue car', he: 'יש לי מכונית כחולה' },
        { en: 'The black cat is big', he: 'החתול השחור גדול', alt: ["The black cat's big"] },
        { en: 'What color is it?', he: 'איזה צבע זה?', alt: ['What colour is it', 'What color is this'] },
      ],
    },
  ],
};
