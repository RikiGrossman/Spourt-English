import type { Unit } from '../../types';

/**
 * Unit 7 (new in v2). Owner: content-a (see docs/spec/v2.md §5 and §10).
 * Lessons u7l1 … are written from the spec; a unit without lessons is hidden by course.ts.
 */
export const unit7: Unit = {
  id: 'u7',
  title: "יחידה 7: בעיר",
  description: "מקומות, הוראות הגעה, תחבורה וקניות",
  color: '#00b8a9',
  level: 'A1+',
  intro: {
    tip: "[[Is there a … near here?]] = יש … קרוב לכאן? בהוראות הגעה משתמשים בציווי בלי [[you]]: [[Turn left]]. ואחרי [[can]] לא בא [[to]]: [[I can swim]].",
    goals: ["לשאול איפה נמצא מקום", "להבין הוראות הגעה", "לנסוע בתחבורה ציבורית ולקנות"],
  },
  lessons: [],
};
