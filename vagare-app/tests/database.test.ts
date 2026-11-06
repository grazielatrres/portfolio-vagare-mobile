function createFakeDb(initialVersion = 0) {
  let userVersion = initialVersion;
  return {
    execAsync: jest.fn(async (sql: string) => {
      const match = sql.match(/PRAGMA user_version\s*=\s*(\d+)/i);
      if (match) {
        userVersion = Number(match[1]);
      }
    }),
    getFirstAsync: jest.fn(async (sql: string) => {
      if (/user_version/i.test(sql)) {
        return { user_version: userVersion };
      }
      return null;
    }),
    getAllAsync: jest.fn(async () => []),
    runAsync: jest.fn(async () => undefined),
    withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => fn()),
  };
}

describe('database.getDatabase', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('não memoiza falha na abertura — a próxima chamada tenta de novo e tem sucesso', async () => {
    jest.doMock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
    const SQLite = require('expo-sqlite');
    const db = createFakeDb();
    (SQLite.openDatabaseAsync as jest.Mock)
      .mockRejectedValueOnce(new Error('disco indisponível'))
      .mockResolvedValueOnce(db);

    const { getDatabase } = require('@/services/database');

    await expect(getDatabase()).rejects.toThrow('disco indisponível');

    const result = await getDatabase();
    expect(result).toBe(db);
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(2);
    expect(db.execAsync).toHaveBeenCalled();
  });

  it('roda a migração apenas uma vez mesmo com múltiplas chamadas', async () => {
    jest.doMock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
    const SQLite = require('expo-sqlite');
    const db = createFakeDb();
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(db);

    const { getDatabase } = require('@/services/database');

    await getDatabase();
    const callsAfterFirst = db.execAsync.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    await getDatabase();
    await getDatabase();

    expect(db.execAsync.mock.calls.length).toBe(callsAfterFirst);
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
  });

  it('não reaplica migrations já marcadas em PRAGMA user_version', async () => {
    jest.doMock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
    const SQLite = require('expo-sqlite');
    const db = createFakeDb(2);
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(db);

    const { getDatabase } = require('@/services/database');
    await getDatabase();

    expect(db.execAsync).not.toHaveBeenCalled();
  });
});
