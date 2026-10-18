import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function openDatabase() {
  return SQLite.openDatabaseAsync('vagare.db');
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDatabase().then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS trips (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          name TEXT NOT NULL,
          destination TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          budget TEXT,
          currency TEXT NOT NULL DEFAULT 'BRL',
          numberOfPeople INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app_meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);

      try {
        await db.execAsync("ALTER TABLE trips ADD COLUMN currency TEXT NOT NULL DEFAULT 'BRL';");
      } catch {
        // coluna já existe
      }

      return db;
    });
  }

  return databasePromise;
}

export async function getAppMeta(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setAppMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [key, value]);
}
