import type { Unit } from '../../types';

/**
 * Unit 2. Owner: content-a (see docs/spec/v2.md §10 and README.md here).
 * Existing lesson ids keep their place; new lessons are appended at the end of the unit.
 */
export const unit2: Unit = {
  id: 'u2',
  title: 'יחידה 2: משפחה וחברים',
  description: 'אנשים סביבנו – תיאור, שייכות ושלילה',
  color: '#1cb0f6',
  level: 'Pre-A1',
  intro: {
    tip: "לפני שם עצם ביחיד שמים [[a]]: [[I am a boy]]. [[his]] ו־[[her]] תלויים במי שהדבר שייך לו: [[his mother]] = אמא שלו. בשלילה מוסיפים [[not]]: [[I am not tired]].",
    goals: ["לתאר אנשים ובני משפחה", "להגיד של מי משהו", "לענות בקצרה: [[Yes, I am]] / [[No, he isn't]]"],
  },
  lessons: [
    {
      id: 'u2l1',
      title: 'אנשים',
      words: [
        { en: 'man', he: 'גבר', sound: 'מֶן' },
        { en: 'woman', he: 'אישה', sound: 'ווּמַן' },
        { en: 'boy', he: 'ילד', sound: 'בּוֹי' },
        { en: 'girl', he: 'ילדה', sound: 'גֶרל' },
        { en: 'friend', he: 'חבר', sound: 'פרֶנד' },
      ],
      sentences: [
        { en: 'I am a boy', he: 'אני ילד', alt: ["I'm a boy"] },
        { en: 'She is a girl', he: 'היא ילדה', alt: ["She's a girl"] },
        { en: 'He is my friend', he: 'הוא החבר שלי', alt: ["He's my friend"] },
      ],
    },
    {
      id: 'u2l2',
      title: 'המשפחה שלי',
      words: [
        { en: 'mother', he: 'אמא', sound: 'מָאדֶ׳ר' },
        { en: 'father', he: 'אבא', sound: 'פָאדֶ׳ר' },
        { en: 'brother', he: 'אח', sound: 'בּרָאדֶ׳ר' },
        { en: 'sister', he: 'אחות', sound: 'סִיסטֶר' },
        { en: 'family', he: 'משפחה', sound: 'פֶמִילִי' },
      ],
      sentences: [
        { en: 'This is my mother', he: 'זאת אמא שלי', alt: ["This is my mom"] },
        { en: 'I have a sister', he: 'יש לי אחות' },
        { en: 'My family is big', he: 'המשפחה שלי גדולה' },
      ],
    },
  ],
};
