import type { Unit } from '../../types';

/**
 * Unit 1. Owner: content-a (see docs/spec/v2.md §10 and README.md here).
 * Existing lesson ids keep their place; new lessons are appended at the end of the unit.
 */
export const unit1: Unit = {
  id: 'u1',
  title: 'יחידה 1: צעדים ראשונים',
  description: 'ברכות, היכרות ונימוס',
  color: '#58cc02',
  level: 'Pre-A1',
  intro: {
    tip: "באנגלית לא מוותרים על [[am / is / are]]: אומרים [[I am good]] ולא [[I good]]. ו־[[you]] אחד משמש גם ל״אתה״, גם ל״את״ וגם ל״אתם״.",
    goals: ["לברך ולהיפרד", "להציג את עצמי ולשאול לשלום", "לבקש ולהתנצל בנימוס"],
  },
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
};
