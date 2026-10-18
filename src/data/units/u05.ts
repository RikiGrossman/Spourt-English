import type { Unit } from '../../types';

/**
 * Unit 5. Owner: content-b (see docs/spec/v2.md §10 and README.md here).
 * Existing lesson ids keep their place; new lessons are appended at the end of the unit.
 */
export const unit5: Unit = {
  id: 'u5',
  title: 'יחידה 5: בבית ובשגרה',
  description: 'הבית שלי ומה אני עושה כל יום',
  color: '#ff4b4b',
  level: 'A1',
  intro: {
    tip: "על שגרה מדברים בהווה פשוט: [[I get up at seven]]. מילים כמו [[always]], [[usually]], [[never]] באות לפני הפועל, ואחרי [[never]] לא מוסיפים [[don't]].",
    goals: ["לתאר את הבית", "לספר על סדר היום", "להגיד כמה פעמים אני עושה משהו"],
  },
  lessons: [
    {
      id: 'u5l1',
      title: 'הבית שלי',
      words: [
        { en: 'house', he: 'בית', sound: 'הָאוּס' },
        { en: 'room', he: 'חדר', sound: 'רוּם' },
        { en: 'table', he: 'שולחן', sound: 'טֵייבּל' },
        { en: 'bed', he: 'מיטה', sound: 'בֶּד' },
        { en: 'door', he: 'דלת', sound: 'דוֹר' },
      ],
      sentences: [
        { en: 'This is my house', he: 'זה הבית שלי', alt: ['This is my home'] },
        { en: 'The door is open', he: 'הדלת פתוחה', alt: ["The door's open"] },
        { en: 'The bed is in the room', he: 'המיטה בחדר', alt: ["The bed's in the room"] },
        { en: 'There is a table in the room', he: 'יש שולחן בחדר', alt: ["There's a table in the room"] },
      ],
    },
    {
      id: 'u5l2',
      title: 'בוקר טוב',
      words: [
        { en: 'morning', he: 'בוקר', sound: 'מוֹרנִינג' },
        { en: 'night', he: 'לילה', sound: 'נַייט' },
        { en: 'work', he: 'עבודה', sound: 'ווֹרק' },
        { en: 'school', he: 'בית ספר', sound: 'סקוּל' },
        { en: 'sleep', he: 'לישון', sound: 'סלִיפּ' },
      ],
      sentences: [
        { en: 'Good morning', he: 'בוקר טוב' },
        { en: 'I go to school', he: 'אני הולך לבית הספר' },
        { en: 'I sleep at night', he: 'אני ישן בלילה' },
        { en: 'I work in the morning', he: 'אני עובד בבוקר' },
      ],
    },
    {
      id: 'u5l3',
      title: 'כל יום',
      words: [
        { en: 'always', he: 'תמיד', sound: 'אוֹלוֵייז' },
        { en: 'never', he: 'אף פעם', sound: 'נֶבֶר' },
        { en: 'every', he: 'כל', sound: 'אֶבְרִי' },
        { en: 'day', he: 'יום', sound: 'דֵיי' },
        { en: 'week', he: 'שבוע', sound: 'וִויק' },
      ],
      sentences: [
        { en: 'I drink coffee every day', he: 'אני שותה קפה כל יום' },
        { en: 'I always eat breakfast', he: 'אני תמיד אוכל ארוחת בוקר' },
        { en: 'I never drink milk', he: 'אני אף פעם לא שותה חלב' },
        { en: 'See you next week', he: 'נתראה בשבוע הבא' },
      ],
    },
  ],
};
