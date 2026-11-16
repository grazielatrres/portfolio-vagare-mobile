import * as SQLite from 'expo-sqlite';

type Migration = {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
};

async function hasColumn(db: SQLite.SQLiteDatabase, table: string, column: string): Promise<boolean> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  return columns.some((c) => c.name === column);
}

// Lista de migrations em ordem. Cada uma roda uma única vez, controlada por
// PRAGMA user_version. Para novas tabelas, adicionar a próxima versão aqui —
// nunca editar uma migration já publicada.
const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
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

      // Bancos criados antes desta migration podem não ter a coluna
      // currency (era adicionada via ALTER TABLE solto). Backfill defensivo.
      if (!(await hasColumn(db, 'trips', 'currency'))) {
        await db.execAsync("ALTER TABLE trips ADD COLUMN currency TEXT NOT NULL DEFAULT 'BRL';");
      }
    },
  },
  {
    version: 2,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS activities (
          id TEXT PRIMARY KEY NOT NULL,
          tripId TEXT NOT NULL,
          name TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT,
          location TEXT,
          period TEXT,
          category TEXT,
          estimatedCost TEXT,
          description TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_activities_tripId ON activities(tripId);

        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY NOT NULL,
          tripId TEXT NOT NULL,
          description TEXT NOT NULL,
          amount TEXT NOT NULL,
          currency TEXT NOT NULL,
          category TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_expenses_tripId ON expenses(tripId);

        CREATE TABLE IF NOT EXISTS infos (
          id TEXT PRIMARY KEY NOT NULL,
          tripId TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          date TEXT,
          details TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_infos_tripId ON infos(tripId);

        CREATE TABLE IF NOT EXISTS pending_mutations (
          id TEXT PRIMARY KEY NOT NULL,
          tripId TEXT NOT NULL,
          entityType TEXT NOT NULL,
          operation TEXT NOT NULL,
          localId TEXT NOT NULL,
          payload TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_pending_mutations_tripId ON pending_mutations(tripId);
      `);
    },
  },
];

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let currentVersion = row?.user_version ?? 0;

  const pending = migrations
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await migration.up(db);
    await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    currentVersion = migration.version;
  }
}

function openDatabase() {
  return SQLite.openDatabaseAsync('vagare.db');
}

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await openDatabase();
  await runMigrations(db);
  return db;
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = initDatabase().catch((error) => {
      // Não memoiza falha: a próxima chamada tenta abrir/migrar de novo.
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
