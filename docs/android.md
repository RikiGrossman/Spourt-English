# אפליקציית אנדרואיד (APK)

האפליקציה לאנדרואיד היא אותה אפליקציית ווב, עטופה ב־[Capacitor](https://capacitorjs.com/). הקבצים נארזים בתוך ה־APK, כך שהיא עובדת גם בלי אינטרנט.
ההתקדמות נשמרת בטלפון. כמו באתר, ההתחברות והליגה עובדות דרך Supabase אחרי שמגדירים אותו (ראו [supabase.md](supabase.md)).

## הורדה והתקנה

1. בטלפון פותחים את הקישור https://rikigrossman.github.io/Spourt-English/SpourtEnglish.apk (אותו קובץ נמצא גם בדף הגרסה: https://github.com/RikiGrossman/Spourt-English/releases/tag/android-latest).
2. פותחים את הקובץ שירד.
3. מאשרים "התקנה ממקורות לא ידועים" לדפדפן (אנדרואיד שואל בפעם הראשונה).

גרסה חדשה מותקנת מעל הישנה, וההתקדמות נשמרת.

## עדכון מתוך האפליקציה

בכל פתיחה האפליקציה בודקת אם יש גרסה חדשה (הקובץ `version.json` בגרסה `android-latest`). אם יש – מופיע חלון "יש גרסה חדשה!" עם כפתור "עדכון עכשיו": האפליקציה מורידה את ה־APK בעצמה ופותחת את מסך ההתקנה של אנדרואיד, בלי להיכנס לדף ההורדות.
בפעם הראשונה אנדרואיד מבקש לאשר "התקנת אפליקציות לא מוכרות" עבור Spourt English. אם אין אינטרנט, הבדיקה פשוט מדלגת עד הפתיחה הבאה.
הקוד: `src/lib/update.ts`, `src/components/UpdatePrompt.tsx` והתוסף הנייטיבי `android/app/src/main/java/com/spourt/english/AppUpdatePlugin.java`.

## איך זה נבנה

ה־workflow ‏`.github/workflows/android.yml`:
- ב־PR – בונה את ה־APK ושומר אותו כ־artifact (בדיקה שהבנייה עובדת).
- בכל דחיפה ל־`main` – בונה ומפרסם מחדש את הגרסה `android-latest`.

מספר הגרסה (`versionCode`) הוא מספר הריצה של ה־workflow, כך שכל APK חדש "גבוה" מהקודם.

## הגייה

ל־WebView של אנדרואיד אין Web Speech API, ולכן באפליקציה ההגייה עוברת דרך מנוע ה־TTS של הטלפון (`@capacitor-community/text-to-speech`, ראו `src/lib/speech.ts`).
אם אין קול באנגלית, מתקינים אותו בהגדרות: הגדרות ← מערכת ← שפה וקלט ← המרת טקסט לדיבור.

## דיבור (תרגילי "אמרו בקול")

בכל שיעור יש שני תרגילים שבהם אומרים משפט באנגלית בקול. באתר הזיהוי עובר דרך ה־Web Speech API של הדפדפן (כרום); באפליקציה – דרך זיהוי הדיבור של אנדרואיד, בתוסף הנייטיבי `android/app/src/main/java/com/spourt/english/SpeechRecognizerPlugin.java` (ראו `src/lib/listen.ts`).
בפעם הראשונה האפליקציה מבקשת הרשאת מיקרופון. אם אין זיהוי דיבור בטלפון, מתקינים/מעדכנים את אפליקציית Google. אפשר לכבות את תרגילי הדיבור בפרופיל, ובתוך תרגיל יש כפתור "לא יכול/ה לדבר עכשיו".

## חתימה

ה־APK נחתם במפתח קבוע ששמור ב־repo (`android/app/spourt-debug.keystore`, סיסמה `android`). זה לפי המוסכמה של מפתחות debug באנדרואיד, והמפתח לא סודי. בזכותו כל בנייה חתומה באותה חתימה, וגרסה חדשה מתעדכנת מעל הקודמת.
לפרסום ב־Google Play צריך מפתח פרטי משלכם (שנשמר ב־GitHub Secrets) ובניית `bundleRelease`.

## פיתוח מקומי

צריך Android Studio (או Android SDK) ו־Java 21.

```bash
npm run android:sync          # בונה את הווב במצב אורח ומעתיק ל־android/
cd android && ./gradlew assembleDebug
# ה־APK: android/app/build/outputs/apk/debug/app-debug.apk
```

האייקונים ומסך הפתיחה נוצרו מהקבצים ב־`assets/` (שמרונדרים מהלוגו ב־`public/icons/` עם `node tools/render-icons.mjs`) עם
`npx @capacitor/assets generate --android --iconBackgroundColor '#1f7cf2' --splashBackgroundColor '#ffffff' --splashBackgroundColorDark '#131f24'`.
