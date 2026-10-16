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
