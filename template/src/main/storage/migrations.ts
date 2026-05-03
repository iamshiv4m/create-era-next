import type { Database as BetterDatabase } from "better-sqlite3";
import log from "electron-log/main";

interface Migration {
  id: number;
  name: string;
  up: (db: BetterDatabase) => void;
}

/**
 * Migrations run in order and are idempotent — we track them in `_migrations`.
 * To add a new one, append an entry with a unique, monotonically-increasing id.
 */
const migrations: Migration[] = [
  {
    id: 1,
    name: "init",
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          body TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
  },
];

export function runMigrations(db: BetterDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = db
    .prepare<[], { id: number }>("SELECT id FROM _migrations ORDER BY id")
    .all()
    .map((r) => r.id);

  const record = db.prepare<[number, string]>("INSERT INTO _migrations (id, name) VALUES (?, ?)");

  for (const m of migrations) {
    if (applied.includes(m.id)) continue;
    log.info(`[sqlite] applying migration ${m.id}: ${m.name}`);
    db.transaction(() => {
      m.up(db);
      record.run(m.id, m.name);
    })();
  }
}
