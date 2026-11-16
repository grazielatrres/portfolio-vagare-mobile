import type { SQLiteDatabase } from 'expo-sqlite';

import { runInTransaction } from '@/services/transactionQueue';

// Simula a conexão única do expo-sqlite: abrir uma transação com outra já
// ativa falha, igual ao "cannot start a transaction within a transaction".
function createSharedConnectionDb() {
  let inTransaction = false;
  const db = {
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => {
      if (inTransaction) {
        throw new Error('cannot start a transaction within a transaction');
      }
      inTransaction = true;
      try {
        await task();
      } finally {
        inTransaction = false;
      }
    }),
  };
  return db as unknown as SQLiteDatabase & typeof db;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('runInTransaction', () => {
  it('executa transações concorrentes uma por vez, na ordem de chegada', async () => {
    const db = createSharedConnectionDb();
    const order: string[] = [];

    const make = (name: string) => async () => {
      order.push(`${name}:start`);
      await tick();
      order.push(`${name}:end`);
    };

    await Promise.all([
      runInTransaction(db, make('activities')),
      runInTransaction(db, make('expenses')),
      runInTransaction(db, make('infos')),
    ]);

    expect(order).toEqual([
      'activities:start',
      'activities:end',
      'expenses:start',
      'expenses:end',
      'infos:start',
      'infos:end',
    ]);
  });

  it('uma transação que falha não bloqueia as próximas', async () => {
    const db = createSharedConnectionDb();
    const done = jest.fn();

    const failing = runInTransaction(db, async () => {
      throw new Error('falhou');
    });
    const next = runInTransaction(db, async () => done());

    await expect(failing).rejects.toThrow('falhou');
    await expect(next).resolves.toBeUndefined();
    expect(done).toHaveBeenCalled();
  });
});
