import type { SQLiteDatabase } from 'expo-sqlite';

// withTransactionAsync do expo-sqlite NÃO é exclusivo: todas as chamadas
// compartilham a mesma conexão, então dois saves em paralelo (ex.: atividades
// + gastos + infos ao abrir uma viagem) intercalam BEGIN/COMMIT/ROLLBACK e
// estouram "cannot start a transaction within a transaction" /
// "cannot rollback - no transaction is active". Esta fila garante que só uma
// transação rode por vez.
let queue: Promise<void> = Promise.resolve();

export function runInTransaction(db: SQLiteDatabase, task: () => Promise<void>): Promise<void> {
  const run = queue.then(() => db.withTransactionAsync(task));
  // A falha de uma transação não pode travar as próximas da fila.
  queue = run.catch(() => undefined);
  return run;
}
