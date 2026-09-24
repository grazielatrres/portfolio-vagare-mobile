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
          numberOfPeople INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      return db;
    });
  }

  return databasePromise;
}
