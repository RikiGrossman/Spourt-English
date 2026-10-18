# התחברות באתר ובאפליקציה (Supabase)

לאתר ב־GitHub Pages ולאפליקציית האנדרואיד אין שרת משלהם. לכן ההרשמה, ההתחברות, סנכרון ההתקדמות והליגה עובדים שם דרך [Supabase](https://supabase.com), שירות חינמי של התחברות ומסד נתונים.
כל עוד Supabase לא מוגדר, האתר והאפליקציה ממשיכים לעבוד במצב אורח בלבד, בלי כפתורי התחברות.

## הקמה (פעם אחת, בערך 5 דקות)

1. **פותחים פרויקט:** נרשמים ב־https://supabase.com, לוחצים **New project**, בוחרים שם (למשל `spourt-english`), סיסמה למסד הנתונים (שומרים אותה בצד) ואזור קרוב (למשל Frankfurt).
2. **יוצרים את הטבלאות:** בתפריט הצד נכנסים ל־**SQL Editor** ← **New query**, מדביקים את כל התוכן של [`supabase/schema.sql`](../supabase/schema.sql) ולוחצים **Run**.
3. **מגדירים כתובות:** ב־**Authentication** ← **URL Configuration**:
   - **Site URL**: `https://rikigrossman.github.io/Spourt-English/`
   - אופציונלי: ב־**Authentication** ← **Sign In / Providers** ← **Email** אפשר לכבות את **Confirm email**. אז נרשמים בלי מייל אישור. אם משאירים אותו פעיל, כל משתמש חדש מקבל מייל ולוחץ על הקישור לפני ההתחברות הראשונה.
4. **מעתיקים שני ערכים:** ב־**Project Settings** ← **API** (או **Data API**):
   - **Project URL**, למשל `https://abcd1234.supabase.co`
   - **anon public key** (מפתח ארוך שמתחיל ב־`eyJ`, או מפתח publishable שמתחיל ב־`sb_publishable_`)

   שני הערכים האלה **ציבוריים** ומיועדים לאתר. ההגנה על הנתונים היא ב־Row Level Security שמוגדר ב־`schema.sql`. אסור להשתמש במפתח `service_role`, שהוא סודי.
5. **שומרים אותם ב־GitHub:** ב־repo נכנסים ל־**Settings** ← **Secrets and variables** ← **Actions** ← לשונית **Variables** ← **New repository variable**, ויוצרים שני משתנים:
   - `VITE_SUPABASE_URL` = ה־Project URL
   - `VITE_SUPABASE_ANON_KEY` = ה־anon key
6. **מפרסמים מחדש:** ב־**Actions** מריצים את **Deploy to GitHub Pages** ואת **Android APK** (‏Run workflow), או פשוט ממזגים את השינוי הבא ל־`main`.

## מה נשמר ואיך זה מוגן

| טבלה | תוכן | מי רואה |
|---|---|---|
| `profiles` | שם התצוגה | רק המשתמש עצמו |
| `progress` | מסמך ההתקדמות (XP, שיעורים, רצף) | רק המשתמש עצמו |
| `xp_events` | נקודות שנצברו, לליגה | אף אחד ישירות. הליגה נקראת דרך הפונקציה `weekly_leaderboard`, שמחזירה רק שם תצוגה ו־XP (אף פעם לא אימייל) |
| `srs_state` (v2) | מצב החזרה המרווחת, שורה לכל מילה/משפט | רק המשתמש עצמו. הכתיבה דרך הפונקציה `merge_srs` (אותם כללי מיזוג כמו `PUT /api/srs`) |
| `events` (v2) | אירועי אנליטיקה אנונימיים | אף לקוח לא יכול לקרוא (insert בלבד, גם לאורח). הדשבורדים קוראים עם ה־service role |

כללי המיזוג והבדיקות (שיעור נעול, תקרת XP לשיעור, תאריך מקומי סביר) זהים לשרת ה־Express ומגיעים מאותו קובץ: `shared/progress-merge.ts`.
**מגבלה ידועה:** בגרסת Supabase הכללים רצים בצד הלקוח, ולכן משתמש מתוחכם יכול לנפח את ה־XP שלו בליגה. ה־XP מוגבל ל־50 לכל רשומה, אבל זה לא מונע ניפוח. אם הליגה תהיה חשובה, אפשר להעביר את הלוגיקה ל־Edge Function.

## עדכון לגרסה 2

מריצים שוב את כל `supabase/schema.sql` ב־SQL Editor (בטוח להריץ שוב – הכול אידמפוטנטי). **הסדר בפריסה:** קודם ה־SQL, אחר כך שרת ה־Express, ורק אז האתר וה־APK.

מה נוסף:
- **`keep_completed_lessons`** – טריגר על `progress`: כשלקוח ישן שומר התקדמות בלי שיעורים שנוספו בגרסה חדשה (למשל `u7l1`), המפתחות האלה נשמרים. כך APK ישן לא מוחק התקדמות.
- **`srs_state` + `merge_srs(items jsonb)`** – מצב החזרה המרווחת. `merge_srs` ממזג פריט־פריט (ה־`last` החדש מנצח; ב־`last` שווה – הקופסה הנמוכה; `seen`/`wrong` – מקסימום), מדלג על פריטים לא תקינים, מוגבל ל־1000 פריטים לקריאה ול־3000 ללומד (פריטים חדשים מעבר לתקרה לא נשמרים), ומחזיר את המצב המלא.
- **`events`** – אירועי אנליטיקה. RLS מאפשר רק insert (ל־anon ול־authenticated, עם `user_id` ריק או של המשתמש עצמו). טריגר `events_rate_limit` מדלג בשקט על יותר מ־600 אירועים בשעה לאותו `anon_id`.
- **`purge_old_events()`** – מוחקת אירועים בני יותר מ־180 יום. אם `pg_cron` זמין (Database → Extensions → pg_cron), מתזמנים פעם ביום:
  ```sql
  select cron.schedule('purge-old-events', '17 3 * * *', 'select public.purge_old_events()');
  ```
  בלי `pg_cron` אפשר להריץ ידנית מדי פעם: `select public.purge_old_events();`

**בדיקה ידנית אחרי ההרצה (US-U1 AC7, US-T1 AC6):**
1. שורת `progress` עם `completed.u7l1` → `update progress set data = jsonb_set(data, '{completed}', '{"u1l1":1}') where ...` → `u7l1` עדיין קיים.
2. עם ה־anon key: `insert` ל־`events` מצליח, `select` מחזיר 0 שורות.
3. משתמש אחד לא רואה שורות `srs_state` של משתמש אחר.

## פיתוח מקומי מול Supabase

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co VITE_SUPABASE_ANON_KEY=... npm run dev:web
```

בלי המשתנים האלה האפליקציה המקומית עובדת מול שרת ה־Express שלנו (`npm run dev`), בדיוק כמו קודם.
