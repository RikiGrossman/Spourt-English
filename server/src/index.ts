import { createApp } from './app';
import { openDb } from './db';

// Dates (streaks, daily XP) are computed in local time; the learners are in Israel.
process.env.TZ ??= 'Asia/Jerusalem';

const port = Number(process.env.PORT) || 3001;
const db = openDb();
const app = createApp(db);

const server = app.listen(port, () => {
  console.log(`[server] Spourt English API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
