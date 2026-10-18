import type { Unit } from '../../types';

/**
 * Unit 6. Owner: content-b (see docs/spec/v2.md §10 and README.md here).
 * Existing lesson ids keep their place; new lessons are appended at the end of the unit.
 */
export const unit6: Unit = {
  id: 'u6',
  title: 'יחידה 6: שאלות והווה פשוט',
  description: 'מספרים על אחרים, שואלים שאלות, מקצועות',
  color: '#2b70c9',
  level: 'A1',
  intro: {
    tip: "עם [[he]], [[she]], [[it]] מוסיפים לפועל [[s]]: [[He likes coffee]]. בשאלה ובשלילה ה־[[s]] עובר ל־[[does]] והפועל חוזר לבסיס: [[Does he like…?]], [[He doesn't like…]].",
    goals: ["לספר מה אחרים עושים", "לשאול שאלות כן/לא ושאלות wh-", "לדבר על מקצועות"],
  },
  lessons: [
    {
      id: 'u6l1',
      title: 'הוא אוהב, היא אוהבת',
      words: [
        { en: 'like', he: 'לאהוב', sound: 'לַייק' },
        { en: 'play', he: 'לשחק', sound: 'פּלֵיי' },
        { en: 'read', he: 'לקרוא', sound: 'רִיד' },
        { en: 'speak', he: 'לדבר', sound: 'ספִּיק' },
        { en: 'English', he: 'אנגלית', sound: 'אִינגלִיש' },
      ],
      sentences: [
        { en: 'He likes coffee', he: 'הוא אוהב קפה' },
        { en: 'He speaks English', he: 'הוא מדבר אנגלית' },
        { en: 'My mother reads every day', he: 'אמא שלי קוראת כל יום', alt: ['My mom reads every day'] },
        { en: 'She plays with her friend', he: 'היא משחקת עם החברה שלה' },
      ],
    },
    {
      id: 'u6l2',
      title: 'אתה מבין?',
      words: [
        { en: 'question', he: 'שאלה', sound: 'קְוֶוסצ׳ן' },
        { en: 'answer', he: 'תשובה', sound: 'אַנסֶר' },
        { en: 'Hebrew', he: 'עברית', sound: 'הִיבּרוּ' },
        { en: 'understand', he: 'להבין', sound: 'אַנדֶרסטֶנד' },
        { en: 'know', he: 'לדעת', sound: 'נוֹאוּ' },
      ],
      sentences: [
        { en: 'Do you speak Hebrew?', he: 'אתה מדבר עברית?' },
        { en: 'Do you understand?', he: 'אתה מבין?' },
        { en: 'Does she like tea?', he: 'היא אוהבת תה?' },
        { en: "I don't know", he: 'אני לא יודע', alt: ['I do not know'] },
      ],
    },
    {
      id: 'u6l3',
      title: 'איפה? מתי? למה?',
      words: [
        { en: 'where', he: 'איפה', sound: 'וֶור' },
        { en: 'who', he: 'מי', sound: 'הוּ' },
        { en: 'when', he: 'מתי', sound: 'וֶן' },
        { en: 'why', he: 'למה', sound: 'וַואי' },
        { en: 'live', he: 'לגור', sound: 'לִיב' },
      ],
      sentences: [
        { en: 'Where do you live?', he: 'איפה אתה גר?' },
        { en: 'I live in Tel Aviv', he: 'אני גר בתל אביב' },
        { en: 'Who is she?', he: 'מי היא?', alt: ["Who's she"] },
        { en: 'When do you work?', he: 'מתי אתה עובד?' },
      ],
    },
  ],
};
