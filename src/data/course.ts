import type { Unit } from '../types';

/**
 * The course content. Each lesson lists the words and sentences it teaches;
 * exercises are generated from them (see lib/exercises.ts), so adding content
 * only means adding data here.
 */
export const course: Unit[] = [
  {
    id: 'u1',
    title: 'יחידה 1: צעדים ראשונים',
    description: 'ברכות, היכרות ומילים בסיסיות',
    color: '#58cc02',
    lessons: [
      {
        id: 'u1l1',
        title: 'שלום!',
        words: [
          { en: 'hello', he: 'שלום', sound: 'הֶלוֹ' },
          { en: 'goodbye', he: 'להתראות', sound: 'גוּדבַּיי' },
          { en: 'yes', he: 'כן', sound: 'יֶס' },
          { en: 'no', he: 'לא', sound: 'נוֹ' },
          { en: 'thanks', he: 'תודה', sound: 'ת׳נקס' },
        ],
        sentences: [
          { en: 'Hello and goodbye', he: 'שלום ולהתראות' },
          { en: 'Yes, thanks', he: 'כן, תודה', alt: ['Yes thank you'] },
          { en: 'No, thanks', he: 'לא, תודה', alt: ['No thank you'] },
        ],
      },
      {
        id: 'u1l2',
        title: 'אני ואתה',
        words: [
          { en: 'I', he: 'אני', sound: 'אַיי' },
          { en: 'you', he: 'אתה', sound: 'יוּ' },
          { en: 'he', he: 'הוא', sound: 'הִי' },
          { en: 'she', he: 'היא', sound: 'שִׁי' },
          { en: 'good', he: 'טוב', sound: 'גוּד' },
        ],
        sentences: [
          { en: 'I am good', he: 'אני טוב', alt: ["I'm good"] },
          { en: 'You are good', he: 'אתה טוב', alt: ["You're good"] },
          { en: 'She is good', he: 'היא טובה', alt: ["She's good"] },
        ],
      },
      {
        id: 'u1l3',
        title: 'מה שלומך?',
        words: [
          { en: 'how', he: 'איך', sound: 'הָאוּ' },
          { en: 'fine', he: 'בסדר', sound: 'פַיין' },
          { en: 'name', he: 'שם', sound: 'נֵיים' },
          { en: 'my', he: 'שלי', sound: 'מַיי' },
          { en: 'what', he: 'מה', sound: 'ווֹט' },
        ],
        sentences: [
          { en: 'How are you?', he: 'מה שלומך?' },
          { en: 'I am fine, thanks', he: 'אני בסדר, תודה', alt: ["I'm fine thanks", 'I am fine thank you'] },
          { en: 'What is your name?', he: 'מה השם שלך?', alt: ["What's your name"] },
          { en: 'My name is Dana', he: 'השם שלי הוא דנה', alt: ["My name's Dana"] },
        ],
      },
    ],
  },
  {
    id: 'u2',
    title: 'יחידה 2: משפחה וחברים',
    description: 'אנשים סביבנו',
    color: '#1cb0f6',
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
  },
  {
    id: 'u3',
    title: 'יחידה 3: אוכל ושתייה',
    description: 'מה אוכלים היום?',
    color: '#ff9600',
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
    ],
  },
];

export const allLessons = course.flatMap((unit) => unit.lessons);

export function findLesson(id: string) {
  for (const unit of course) {
    const lesson = unit.lessons.find((l) => l.id === id);
    if (lesson) return { unit, lesson };
  }
  return undefined;
}
