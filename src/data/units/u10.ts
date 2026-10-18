import type { Unit } from '../../types';

/**
 * Unit 10 (new in v2). Owner: content-b (see docs/spec/v2.md §5 and §10).
 * Lessons u10l1 … are written from the spec; a unit without lessons is hidden by course.ts.
 */
export const unit10: Unit = {
  id: 'u10',
  title: "יחידה 10: אתמול",
  description: "מספרים מה עשינו – עבר פשוט",
  color: '#d9480f',
  level: 'A2',
  intro: {
    tip: "בעבר רוב הפעלים מקבלים [[ed]]: [[worked]], [[played]]; חלק לא רגילים: [[went]], [[ate]], [[saw]]. בשאלה ובשלילה העבר עובר ל־[[did]] והפועל חוזר לבסיס: [[Did you go?]] – ולא [[Did you went?]]",
    goals: ["לספר איפה הייתי", "לספר מה עשיתי אתמול", "לשאול ולהגיד מה לא עשיתי"],
  },
  lessons: [],
};
