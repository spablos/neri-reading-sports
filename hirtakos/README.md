# חירטאקוס 🇬🇷

אפליקציה לאיסוף הזמנות של ארוחה משפחתית. תפריט הדגל: **ארוחת בוקר יוונית**.

## רכיבים

```
hirtakos/
├── index.html          # דף הבית - רשת אנשים, כל אחד בוחר את עצמו
├── order.html          # טופס ההזמנה האישית
├── admin.html          # ניהול: סיכום, פירוט, תרגום ליוונית
├── styles.css
├── app.js              # frontend logic
├── menu.js             # הגדרת התפריטים (data-driven)
├── people.js           # רשימת המשפחות והאנשים
├── server.py           # Python HTTP API (port 9100)
├── hirtakos.service    # systemd unit
├── nginx.conf.snippet  # קונפיגורציה ל-nginx
├── deploy.sh           # סקריפט deployment
└── data/               # JSON storage (נוצר אוטומטית)
```

## ארכיטקטורה

- Frontend: HTML + vanilla JS (RTL, mobile-first)
- Backend: Python 3 stdlib HTTPServer על port 9100 (loopback)
- Reverse proxy: nginx מ-`/hirtakos/api/` ל-`http://127.0.0.1:9100/`
- אחסון: קובץ JSON אחד (`data/state.json`) - כולל "ארוחה פעילה" + היסטוריה
- תרגום: נקודת קצה ציבורית (חינמית) של Google Translate
  - רק ה-**הערות החופשיות** נשלחות לתרגום
  - שמות הפריטים והאפשרויות כבר מוגדרים ביוונית ב-`menu.js`

## הוספת אנשים / עריכת שמות

עורכים את `people.js` ודוחפים מחדש (אין צורך ב-DB migrations).

## הוספת תפריט חדש (למשל ארוחת ערב יוונית)

מוסיפים entry חדש ל-`window.MENUS` ב-`menu.js`. המבנה:

```js
'dinner-greek': {
    id: 'dinner-greek',
    name: 'ארוחת ערב יוונית',
    greekName: 'Ελληνικό δείπνο',
    emoji: '🍷',
    items: [ /* פריטים עם options - ראה greek-breakfast לדוגמה */ ]
}
```

לאחר מכן, ב-`admin.html` → "ניהול" → "ארוחה חדשה" - יופיע ב-dropdown.

## הרצה מקומית (לפיתוח)

```bash
# מהתיקייה hirtakos/
HIRTAKOS_DATA_DIR=$(pwd)/data HIRTAKOS_BIND=0.0.0.0 python3 server.py &

# שרת סטטי פשוט לקבצים
python3 -m http.server 8080
```

ואז: http://localhost:8080/ + ה-frontend יזהה אוטומטית את ה-API
ב-`http://localhost:9100`. אם זה לא עובד, אפשר לאלץ:

```html
<script>window.HIRTAKOS_API = 'http://localhost:9100';</script>
```

לפני `<script src="app.js">` בעמוד הרצוי.

## Deployment ל-spablos.com

### צד שרת (פעם אחת)

1. ודאו ש-`python3` מותקן.
2. הריצו על השרת (כשורש):
   ```bash
   sudo ./deploy.sh
   ```
   זה:
   - מעתיק את הקבצים ל-`/var/www/html/hirtakos/`
   - יוצר תיקיית `data/` ומגדיר הרשאות `pablo:pablo`
   - מתקין ומפעיל את ה-systemd service `hirtakos`
3. עורכים את ה-nginx config של spablos.com והוסיפו את התוכן של
   `nginx.conf.snippet` בתוך ה-`server { ... }` המתאים.
4. ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Deploy מחשב מקומי לשרת מרוחק

```bash
./deploy.sh --user pablo --host spablos.com
```

(צריך גישת sudo ללא סיסמה, או להיות מוכן להזין סיסמה כשמתבקש)

### בדיקות בריאות

```bash
# API ישיר:
curl http://127.0.0.1:9100/healthz

# דרך nginx:
curl https://spablos.com/hirtakos/api/healthz
```

## נתיבי הגישה

- משתמש רגיל: `https://spablos.com/hirtakos/`
- ניהול: `https://spablos.com/hirtakos/admin.html`

## אבטחה

אין כרגע אימות - מי שיש לו את ה-URL יכול להזמין/להפעיל ניהול.
זה מתאים לארוחת משפחה אינטימית. אם תרצה authentication בעתיד,
אפשר להוסיף Basic auth ב-nginx על `/hirtakos/admin.html` בלבד.

## תרגום ליוונית

- שמות הפריטים והאפשרויות מתורגמים ידנית ב-`menu.js` (שדה `greekName`).
- הערות חופשיות מתורגמות ב-runtime על ידי `server.py` →
  `translate.googleapis.com/translate_a/single` (חינם, ללא API key).
- אם השירות החינמי לא זמין, ההערות מוצגות בעברית (graceful fallback).

## נתונים

הכל ב-`/var/www/html/hirtakos/data/state.json`. גיבוי = `cp` של הקובץ.
