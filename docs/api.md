# תיעוד ה־API

מקור האמת הוא הקובץ [`shared/api.ts`](../shared/api.ts) – הטיפוסים שם משותפים לאפליקציה (`src/`) ולשרת (`server/`). מסמך זה מסביר אותם בשפה אנושית, עם דוגמאות. אם יש סתירה – `shared/api.ts` קובע.

## כללי

| נושא | ערך |
|---|---|
| בסיס | כל הנתיבים תחת `/api`. בפיתוח Vite מעביר (proxy) את `/api` אל `http://localhost:3001` |
| פורמט | JSON בלבד (`Content-Type: application/json`) |
| אימות | `Authorization: Bearer <token>` בנקודות הקצה המסומנות 🔒. הטוקן מתקבל מהרשמה/התחברות |
| שגיאות | סטטוס שאינו 2xx, וגוף מסוג `ApiError` |
| תאריכים | `createdAt` – מחרוזת ISO-8601; `lastActiveDate` – `YYYY-MM-DD` לפי השעון המקומי של הלומד |
| חותמות זמן | `heartsUpdatedAt` – מילישניות מאז epoch |

### אובייקט שגיאה – `ApiError`

```json
{ "error": "email_taken", "message": "כתובת האימייל כבר רשומה" }
```

- `error` – קוד קצר באנגלית, לשימוש בקוד.
- `message` – הודעה **בעברית** שאפשר להציג ללומד כמו שהיא.

### קודי סטטוס וקודי שגיאה

החוזה מגדיר את מבנה השגיאה אך לא רשימה סגורה של קודים. אלה הקודים שהשרת ב־`server/` מחזיר בפועל (הלקוח צריך להסתמך על הסטטוס ועל `message`):

| סטטוס | `error` | מתי |
|---|---|---|
| 400 | `invalid_email`, `weak_password`, `invalid_password`, `invalid_display_name` | הרשמה: אימייל לא תקין, סיסמה קצרה מ־8 תווים (או ארוכה מ־200), שם תצוגה שאינו 2–30 תווים |
| 400 | `missing_credentials` | התחברות בלי אימייל או סיסמה |
| 400 | `invalid_progress` | גוף `PUT /api/progress` שאינו `Progress` תקין |
| 400 | `invalid_xp`, `invalid_accuracy` | `xp` שאינו מספר, או `accuracy` מחוץ ל־0–100 |
| 401 | `unauthorized` | אין טוקן, טוקן לא תקין או פג תוקף |
| 401 | `invalid_credentials` | אימייל או סיסמה שגויים בהתחברות (הודעה אחת לשני המקרים) |
| 403 | `lesson_locked` | השלמת שיעור שעדיין נעול לפי ההתקדמות השמורה בשרת |
| 404 | `not_found` | נתיב API לא קיים |
| 404 | `lesson_not_found` | `lessonId` שאינו בקורס |
| 409 | `email_taken` | הרשמה עם אימייל שכבר קיים (ללא תלות ברישיות) |
| 429 | `rate_limited` | יותר מ־20 ניסיונות הרשמה/התחברות ב־15 דקות מאותה כתובת IP |
| 500 | `server_error` | תקלה פנימית |

---

## אובייקטים

### `User`
```json
{ "id": "u_7f3c", "email": "dana@example.com", "displayName": "דנה", "createdAt": "2026-10-18T09:12:00.000Z" }
```

### `Progress`
מוגדר ב־`src/lib/progress.ts` (אותו טיפוס בדפדפן ובשרת).

| שדה | טיפוס | משמעות |
|---|---|---|
| `xp` | number | סה״כ נקודות |
| `completed` | `Record<lessonId, number>` | כמה פעמים כל שיעור הושלם |
| `streak` | number | רצף ימים (כפי שנשמר; התצוגה מאפסת אם דילגו על יום) |
| `lastActiveDate` | string \| null | תאריך מקומי של השיעור האחרון |
| `xpToday` | number | XP שנצבר ביום `lastActiveDate` |
| `hearts` | number | 0–5 |
| `heartsUpdatedAt` | number | ממנו נספר שעון מילוי הלבבות (לב כל 30 דקות) |

```json
{
  "xp": 45,
  "completed": { "u1l1": 2, "u1l2": 1 },
  "streak": 3,
  "lastActiveDate": "2026-10-18",
  "xpToday": 15,
  "hearts": 4,
  "heartsUpdatedAt": 1792310400000
}
```

---

## נקודות קצה

### `GET /api/health`
בדיקת חיים. ללא אימות.

```http
GET /api/health
```
```json
200 { "ok": true, "version": "0.2.0" }
```

### `POST /api/auth/register`
יצירת חשבון. מחזיר טוקן – המשתמש מחובר מיד.

```http
POST /api/auth/register
Content-Type: application/json

{ "email": "dana@example.com", "password": "secret123", "displayName": "דנה" }
```
```json
201 { "token": "eyJhbGciOi...", "user": { "id": "u_7f3c", "email": "dana@example.com", "displayName": "דנה", "createdAt": "2026-10-18T09:12:00.000Z" } }
```
שגיאות: `400` (שדה חסר/לא תקין, סיסמה < 8), `409 email_taken`.

### `POST /api/auth/login`
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "dana@example.com", "password": "secret123" }
```
```json
200 { "token": "eyJhbGciOi...", "user": { "id": "u_7f3c", "email": "dana@example.com", "displayName": "דנה", "createdAt": "2026-10-18T09:12:00.000Z" } }
```
שגיאות: `400`, `401 invalid_credentials`.

### `GET /api/me` 🔒
המשתמש המחובר וההתקדמות שלו – משמש לשחזור סשן אחרי רענון.

```http
GET /api/me
Authorization: Bearer eyJhbGciOi...
```
```json
200 { "user": { "id": "u_7f3c", "email": "dana@example.com", "displayName": "דנה", "createdAt": "..." }, "progress": { "xp": 45, "completed": { "u1l1": 2 }, "streak": 3, "lastActiveDate": "2026-10-18", "xpToday": 15, "hearts": 4, "heartsUpdatedAt": 1792310400000 } }
```
שגיאות: `401`.

### `GET /api/progress` 🔒
```json
200 { "progress": { ... } }
```

### `PUT /api/progress` 🔒
מעלה התקדמות מקומית (למשל אורח שנרשם, או סנכרון אחרי עבודה אופליין). **השרת ממזג** ולא דורס:

| שדה | כלל מיזוג |
|---|---|
| `xp` | המקסימום מבין השרת והלקוח |
| `completed` | איחוד המפתחות; לכל שיעור – המונה הגבוה |
| `lastActiveDate` + `streak` | לוקחים את התאריך המאוחר יותר, יחד עם ה־streak שלו (בתאריך זהה – ה־streak הגבוה) |
| `xpToday` | מגיע יחד עם ה־`lastActiveDate` שנבחר (בתאריך זהה – הגבוה) |
| `hearts`, `heartsUpdatedAt` | אחרי החלת מילוי הלבבות בשני הצדדים, נשמר המספר **הנמוך** עם השעון שלו (סנכרון לא ממלא לבבות) |
| `dailyGoal` | שדה מקומי של הלקוח; מתקבל ולא נשמר בשרת |

עלייה ב־`xp` שנובעת מהמיזוג (תרגול, שיעורים שהושלמו אופליין) נרשמת גם ל־XP השבועי של הליגה, עד 50 XP לכל סנכרון.

המיזוג אידמפוטנטי: שליחה חוזרת של אותה התקדמות לא משנה את התוצאה.

```http
PUT /api/progress
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{ "xp": 30, "completed": { "u1l1": 1, "u1l3": 1 }, "streak": 1, "lastActiveDate": "2026-10-18", "xpToday": 30, "hearts": 5, "heartsUpdatedAt": 1792310400000 }
```
```json
200 { "progress": { "xp": 45, "completed": { "u1l1": 2, "u1l2": 1, "u1l3": 1 }, "streak": 3, "lastActiveDate": "2026-10-18", ... } }
```
שגיאות: `400` (גוף שאינו `Progress` תקין), `401`.

### `POST /api/lessons/:lessonId/complete` 🔒
רישום השלמת שיעור. השרת מפעיל את אותו כלל `completeLesson` מ־`src/lib/progress.ts` (XP, רצף, מונה) ושומר את האירוע לצורך לוח המובילים.

```http
POST /api/lessons/u1l3/complete
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{ "xp": 15, "accuracy": 100 }
```
```json
200 { "progress": { "xp": 60, "completed": { "u1l1": 2, "u1l2": 1, "u1l3": 1 }, ... } }
```
`xp` מעוגל ונחתך לטווח 0–50 (הלקוח שולח 10–15). שגיאות: `400` (`xp` שאינו מספר, או `accuracy` מחוץ ל־0–100), `401`, `403 lesson_locked`, `404 lesson_not_found`.

> הערה: `lastActiveDate` מחושב בשרת לפי השעון שלו – ייתכן פער של יום בקצוות אזורי זמן. הלקוח ממשיך לחשב רצף מקומית; ראו [architecture.md](./architecture.md).

### `GET /api/leaderboard`
עשרים הלומדים המובילים לפי XP בשבעת הימים האחרונים. **אימות אופציונלי** – עם טוקן, השורה של המשתמש מסומנת `isMe: true`.

```http
GET /api/leaderboard
Authorization: Bearer eyJhbGciOi...   (אופציונלי)
```
```json
200 {
  "entries": [
    { "rank": 1, "displayName": "יוסי", "weeklyXp": 210, "isMe": false },
    { "rank": 2, "displayName": "דנה", "weeklyXp": 145, "isMe": true },
    { "rank": 3, "displayName": "Noa", "weeklyXp": 90, "isMe": false }
  ]
}
```
- ממוין לפי `weeklyXp` בסדר יורד; `rank` מתחיל ב־1.
- מוצג רק שם תצוגה – אף פעם לא אימייל או מזהה.

---

## דוגמה: זרימת אורח → משתמש רשום

```
1. אורח לומד → Progress נשמר ב־localStorage
2. POST /api/auth/register            → { token, user }
3. PUT  /api/progress (Progress מקומי) → { progress: ממוזג }
4. הלקוח מחליף את המקומי בממוזג ושומר את הטוקן
5. בכל סיום שיעור: completeLesson מקומית + POST /api/lessons/:id/complete
6. ברענון: GET /api/me → מיזוג עם המקומי (PUT אם המקומי חדש יותר)
```
