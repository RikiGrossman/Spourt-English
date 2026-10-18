# Spourt English 🇬🇧

אפליקציה ללימוד אנגלית לדוברי עברית, בסגנון דואולינגו: מסלול של יחידות ושיעורים קצרים שנפתחים אחד אחרי השני, עם לבבות, XP, רצף ימים, יעד יומי וליגה שבועית.
אפשר ללמוד כאורח בלי הרשמה (ההתקדמות נשמרת במכשיר), ואפשר ליצור פרופיל כדי לסנכרן בין מכשירים ולהתחרות בליגה.

## מה יש באפליקציה

- **מסלול לימוד** – 6 יחידות ו־16 שיעורים (רמות Pre‑A1 עד A2): ברכות, היכרות, אוכל, מספרים וצבעים, בית ושגרה, שאלות וגוף שלישי. כל שיעור נפתח רק אחרי שמסיימים את הקודם.
- **4 סוגי תרגילים**, שנוצרים אוטומטית מתוכן השיעור: בחירה מרובה, התאמת זוגות, בניית משפט מבנק מילים (לשני הכיוונים) והאזנה (כולל השמעה איטית 🐢).
- **לבבות** ❤️ – טעות עולה לב, ולב חדש מתמלא כל 30 דקות. תרגיל שטעו בו חוזר בסוף השיעור.
- **XP, רצף ימים 🔥 ויעד יומי** (10/20/30/50 XP) שבוחרים במסך הפתיחה.
- **תרגול** 💪 – חזרה על שיעורים שכבר הושלמו, בלי לבבות.
- **חשבון וסנכרון** – הרשמה/התחברות, מיזוג ההתקדמות המקומית עם השרת, וסנכרון חוזר כשהרשת חוזרת.
- **ליגה שבועית** 🏆 – דירוג לפי XP בשבעת הימים האחרונים. גם אורחים יכולים לצפות.
- **פרופיל** – מצב סנכרון, יעד יומי, ערכת נושא (אוטומטי/בהיר/כהה) וצלילים.
- **PWA** – אפשר להתקין כאפליקציה בטלפון. מצב כהה, אנימציות, צלילים, נגישות ותמיכה מלאה ב־RTL.

## טכנולוגיות

| חלק | תיקייה | טכנולוגיה |
|---|---|---|
| אפליקציית הווב | `src/` | React 19 + Vite + TypeScript |
| חוזה ה־API המשותף | `shared/api.ts` | טיפוסי TypeScript שמשמשים את שני הצדדים |
| שרת | `server/` | Express 5 + SQLite מובנה של Node (`node:sqlite`), מורץ עם tsx |
| כלים | שורש הפרויקט | Vitest, ESLint, Prettier, GitHub Actions, Docker |

השרת משתמש באותם מודולים טהורים של הלקוח (`src/lib/progress.ts`, `src/data/course.ts`), כך שכללי המשחק זהים בשני הצדדים.

## דרישות

- Node.js 22.15 ומעלה (ראו `.nvmrc`)
- npm

## הרצה בפיתוח

```bash
npm install        # מתקין גם את התלויות של server/ (postinstall)
npm run dev        # Vite על http://localhost:5173 + שרת ה־API על פורט 3001
```

Vite מעביר (proxy) כל בקשה ל־`/api` אל השרת. אם השרת לא רץ, האפליקציה עובדת במצב אורח בלבד.
אפשר גם להריץ כל צד לבד: `npm run dev:web` או `npm run dev:server`.

### משתני סביבה

מעתיקים את `.env.example` ל־`.env` (בשורש או ב־`server/`) ומעדכנים. משתנים שכבר מוגדרים בסביבה גוברים על הקובץ.

| משתנה | ברירת מחדל | הסבר |
|---|---|---|
| `PORT` | `3001` | הפורט של השרת |
| `DATABASE_PATH` | `./data/spourt.db` | קובץ ה־SQLite (נוצר אוטומטית) |
| `JWT_SECRET` | – | סוד לחתימת טוקנים. **חובה בפרודקשן** (השרת לא יעלה בלעדיו) |
| `NODE_ENV` | `development` | ב־`production` השרת מגיש גם את `dist/` |
| `TRUST_PROXY` | – | `1` מאחורי reverse proxy, כדי שהגבלת הקצב תראה את כתובת ה־IP האמיתית |
| `TZ` | `Asia/Jerusalem` | אזור הזמן לחישוב רצף ו־XP יומי כשהלקוח לא שלח תאריך מקומי |

## בדיקות ואיכות קוד

```bash
npm run typecheck  # tsc לווב ולשרת
npm run lint       # ESLint
npm test           # בדיקות הווב (Vitest) ואז בדיקות השרת (Vitest + supertest)
npm run test:e2e   # בדיקות קצה־לקצה (Playwright): מרים שרת עם DB בזיכרון + Vite, ומריץ ב־Chromium. לא מוריד דפדפנים – CHROMIUM_PATH או /opt/pw-browsers/chromium
npm run build      # בנייה של אפליקציית הווב ל־dist/
npm run check      # הכול ברצף
npm run format     # Prettier
```

ה־CI ב־GitHub Actions (`.github/workflows/ci.yml`) מריץ את כל השלבים האלה ובונה גם את ה־Docker image.

## הרצה בפרודקשן

```bash
npm install
npm run build
NODE_ENV=production JWT_SECRET=<סוד-ארוך> npm start
```

השרת מגיש את ה־API תחת `/api` ואת האפליקציה הבנויה מ־`dist/` על אותו פורט (ברירת מחדל http://localhost:3001).
`index.html`, `sw.js` והמניפסט נשלחים עם `no-cache`, וקבצי `assets/` (עם hash בשם) נשמרים במטמון לטווח ארוך.

## הרצה עם Docker

```bash
JWT_SECRET=$(openssl rand -hex 32) docker compose up --build
# פותחים http://localhost:3001
```

או בלי compose:

```bash
docker build -t spourt-english .
docker run -p 3001:3001 -e JWT_SECRET=<סוד> -v spourt-data:/app/data spourt-english
```

מסד הנתונים נשמר ב־volume בשם `spourt-data`. ל־image יש HEALTHCHECK על `/api/health`.

## מבנה הפרויקט

```
src/
  data/course.ts        תוכן הקורס – יחידות, שיעורים, מילים ומשפטים
  lib/exercises.ts      יצירת תרגילים מתוך תוכן השיעור
  lib/answer.ts         בדיקת תשובות (מתעלם מאותיות גדולות, פיסוק וניקוד)
  lib/progress.ts       לבבות, XP, רצף ופתיחת שיעורים (משותף ללקוח ולשרת)
  lib/api.ts            לקוח HTTP מוקלד ל־API
  lib/account.ts        התחברות וסנכרון ברקע
  lib/sync.ts           מיזוג התקדמות מקומית עם השרת
  components/           מסכים ותרגילים
shared/api.ts           חוזה ה־HTTP בין הלקוח לשרת
server/src/
  app.ts                הרכבת אפליקציית Express (אבטחה, ראוטים, הגשת dist/)
  routes/               auth, progress, leaderboard, health
  db.ts, repo.ts        SQLite, מיגרציות ושאילתות
  auth.ts               סיסמאות (scrypt), JWT והגבלת קצב
  merge.ts              ניקוי ומיזוג התקדמות
public/                 מניפסט PWA, אייקונים ו־service worker
docs/                   תיעוד המוצר והמערכת
```

## API בקצרה

| נתיב | הסבר |
|---|---|
| `GET /api/health` | בדיקת תקינות |
| `POST /api/auth/register` | הרשמה (מחזיר 201 עם טוקן) |
| `POST /api/auth/login` | התחברות |
| `GET /api/me` 🔒 | המשתמש וההתקדמות שלו |
| `GET`/`PUT /api/progress` 🔒 | קריאה / העלאה ומיזוג של התקדמות |
| `POST /api/lessons/:lessonId/complete` 🔒 | רישום השלמת שיעור |
| `GET /api/leaderboard` | הליגה השבועית (טוקן אופציונלי מסמן את השורה שלי) |

פירוט מלא, דוגמאות וקודי שגיאה: [docs/api.md](docs/api.md).

## תיעוד

- [docs/PRD.md](docs/PRD.md) – חזון, פרסונות, כללי משחק ותעדוף פיצ׳רים
- [docs/user-stories.md](docs/user-stories.md) – סיפורי משתמש וקריטריוני קבלה (המפרט לבדיקות)
- [docs/curriculum.md](docs/curriculum.md) – תוכנית הלימודים, טעויות נפוצות של דוברי עברית ומדריך סגנון לתוכן
- [docs/api.md](docs/api.md) – תיעוד ה־API
- [docs/architecture.md](docs/architecture.md) – ארכיטקטורה, מודל נתונים וזרימת הסנכרון
- [docs/roadmap.md](docs/roadmap.md) – שלבים הבאים וחוב טכני
- [CONTRIBUTING.md](CONTRIBUTING.md) – איך לתרום לפרויקט
- `docs/handoff/` – הערות המסירה של כל חלק (תשתית, ממשק, שרת, אפיון)

## הוספת תוכן

מוסיפים שיעור ל־`src/data/course.ts` עם מילים (`words`) ומשפטים (`sentences`). התרגילים נוצרים ממנו אוטומטית.
ב־`alt` אפשר להוסיף תשובות נוספות שיתקבלו (למשל `I'm` במקום `I am`). לפני שכותבים תוכן כדאי לקרוא את מדריך הסגנון ב־[docs/curriculum.md](docs/curriculum.md).
