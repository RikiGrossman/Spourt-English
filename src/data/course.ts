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
  },
  {
    id: 'u4',
    title: 'יחידה 4: מספרים וצבעים',
    description: 'סופרים, צובעים ומספרים בני כמה אנחנו',
    color: '#ce82ff',
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
  },
  {
    id: 'u5',
    title: 'יחידה 5: בבית ובשגרה',
    description: 'הבית שלי ומה אני עושה כל יום',
    color: '#ff4b4b',
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
  },
  {
    id: 'u6',
    title: 'יחידה 6: שאלות והווה פשוט',
    description: 'מספרים על אחרים ושואלים שאלות',
    color: '#2b70c9',
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
