# אפליקציית אנדרואיד (APK)

האפליקציה לאנדרואיד היא אותה אפליקציית ווב, עטופה ב־[Capacitor](https://capacitorjs.com/). הקבצים נארזים בתוך ה־APK, כך שהיא עובדת גם בלי אינטרנט.
ההתקדמות נשמרת בטלפון. כמו באתר, ההתחברות והליגה עובדות דרך Supabase אחרי שמגדירים אותו (ראו [supabase.md](supabase.md)).

## הורדה והתקנה

1. בטלפון פותחים את דף הגרסה: https://github.com/RikiGrossman/Spourt-English/releases/tag/android-latest
2. מורידים את `SpourtEnglish.apk` ופותחים אותו.
3. מאשרים "התקנה ממקורות לא ידועים" לדפדפן (אנדרואיד שואל בפעם הראשונה).

גרסה חדשה מותקנת מעל הישנה, וההתקדמות נשמרת.

## איך זה נבנה

ה־workflow ‏`.github/workflows/android.yml`:
- ב־PR – בונה את ה־APK ושומר אותו כ־artifact (בדיקה שהבנייה עובדת).
- בכל דחיפה ל־`main` – בונה ומפרסם מחדש את הגרסה `android-latest`.

מספר הגרסה (`versionCode`) הוא מספר הריצה של ה־workflow, כך שכל APK חדש "גבוה" מהקודם.

## הגייה

ל־WebView של אנדרואיד אין Web Speech API, ולכן באפליקציה ההגייה עוברת דרך מנוע ה־TTS של הטלפון (`@capacitor-community/text-to-speech`, ראו `src/lib/speech.ts`).
אם אין קול באנגלית, מתקינים אותו בהגדרות: הגדרות ← מערכת ← שפה וקלט ← המרת טקסט לדיבור.

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

האייקונים ומסך הפתיחה נוצרו מהקבצים ב־`assets/` עם
`npx @capacitor/assets generate --android --iconBackgroundColor '#58cc02' --splashBackgroundColor '#ffffff' --splashBackgroundColorDark '#131f24'`.
