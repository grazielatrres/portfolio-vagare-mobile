jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `uuid-${Math.random().toString(36).slice(2)}`),
}));

jest.mock('@/services/database', () => ({ getDatabase: jest.fn() }));

jest.mock('@/services/activities', () => ({
  createActivity: jest.fn(),
  updateActivity: jest.fn(),
  deleteActivity: jest.fn(),
}));

jest.mock('@/services/expenses', () => ({
  createExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));

jest.mock('@/services/infos', () => ({
  createInfo: jest.fn(),
  updateInfo: jest.fn(),
  deleteInfo: jest.fn(),
}));

jest.mock('@/services/activitiesCache', () => ({
  upsertActivityToCache: jest.fn(),
  removeActivityFromCache: jest.fn(),
}));

jest.mock('@/services/expensesCache', () => ({
  upsertExpenseToCache: jest.fn(),
  removeExpenseFromCache: jest.fn(),
}));

jest.mock('@/services/infosCache', () => ({
  upsertInfoToCache: jest.fn(),
  removeInfoFromCache: jest.fn(),
}));

jest.mock('@/services/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));

import { createActivity, updateActivity } from '@/services/activities';
import { removeActivityFromCache } from '@/services/activitiesCache';
import { ApiError } from '@/services/api';
import { getDatabase } from '@/services/database';
import { queryClient } from '@/services/queryClient';
import {
  discardLocalEntity,
  drainPendingMutations,
  enqueueMutation,
  getPendingMutations,
} from '@/services/syncQueue';

function createFakeDb() {
  let rows: Array<Record<string, unknown>> = [];

  return {
    runAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      if (/INSERT INTO pending_mutations/i.test(sql)) {
        const [id, tripId, entityType, operation, localId, payload, createdAt] = params;
        rows.push({ id, tripId, entityType, operation, localId, payload, createdAt });
      } else if (/DELETE FROM pending_mutations WHERE id = \?/i.test(sql)) {
        rows = rows.filter((r) => r.id !== params[0]);
      } else if (/DELETE FROM pending_mutations WHERE localId = \?/i.test(sql)) {
        rows = rows.filter((r) => r.localId !== params[0]);
      } else if (/DELETE FROM pending_mutations\s*$/i.test(sql.trim())) {
        rows = [];
      }
    }),
    getAllAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      if (params.length > 0) {
        return rows.filter((r) => r.tripId === params[0]);
      }
      return [...rows];
    }),
  };
}

describe('syncQueue', () => {
  let db: ReturnType<typeof createFakeDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    db = createFakeDb();
    (getDatabase as jest.Mock).mockResolvedValue(db);
  });

  it('enqueueMutation nunca lança, mesmo com SQLite indisponível', async () => {
    (getDatabase as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));
    await expect(
      enqueueMutation({ tripId: 't1', entityType: 'activity', operation: 'create', localId: 'local-1', payload: {} }),
    ).resolves.toBeUndefined();
  });

  it('getPendingMutations resolve [] em falha de SQLite', async () => {
    (getDatabase as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));
    await expect(getPendingMutations('t1')).resolves.toEqual([]);
  });

  it('discardLocalEntity remove da fila e do cache uma entidade nunca sincronizada', async () => {
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-1',
      payload: { name: 'X', date: '2026-01-01' },
    });

    await discardLocalEntity('activity', 'local-1');

    await expect(getPendingMutations('t1')).resolves.toEqual([]);
    expect(removeActivityFromCache).toHaveBeenCalledWith('local-1');
  });

  it('drainPendingMutations para na primeira ApiError(0), preservando a ordem do restante', async () => {
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-1',
      payload: { name: 'A', date: '2026-01-01' },
    });
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-2',
      payload: { name: 'B', date: '2026-01-02' },
    });

    (createActivity as jest.Mock).mockRejectedValueOnce(new ApiError(0, 'sem conexão'));

    await drainPendingMutations('token-1');

    const remaining = await getPendingMutations('t1');
    expect(remaining).toHaveLength(2);
    expect(remaining[0].localId).toBe('local-1');
    expect(createActivity).toHaveBeenCalledTimes(1);
  });

  it('descarta mutação quando o servidor rejeita por motivo real (não status 0)', async () => {
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-1',
      payload: { name: 'A', date: '2026-01-01' },
    });

    (createActivity as jest.Mock).mockRejectedValueOnce(new ApiError(422, 'inválido'));

    await drainPendingMutations('token-1');

    await expect(getPendingMutations('t1')).resolves.toEqual([]);
  });

  it('resolve create→update do mesmo localId para o id real do servidor ao drenar', async () => {
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-1',
      payload: { name: 'A', date: '2026-01-01' },
    });
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'update',
      localId: 'local-1',
      payload: { name: 'A editada', date: '2026-01-01' },
    });

    (createActivity as jest.Mock).mockResolvedValue({ id: 'real-1', tripId: 't1', name: 'A' });
    (updateActivity as jest.Mock).mockResolvedValue({ id: 'real-1', tripId: 't1', name: 'A editada' });

    await drainPendingMutations('token-1');

    expect(updateActivity).toHaveBeenCalledWith('token-1', 't1', 'real-1', { name: 'A editada', date: '2026-01-01' });
    await expect(getPendingMutations('t1')).resolves.toEqual([]);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['trips', 't1'] });
  });

  it('não drena duas vezes em paralelo (guard isDraining)', async () => {
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-1',
      payload: { name: 'A', date: '2026-01-01' },
    });

    let resolveCreate: (value: unknown) => void = () => {};
    (createActivity as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolveCreate = resolve; }),
    );

    const first = drainPendingMutations('token-1');
    const second = drainPendingMutations('token-1');

    resolveCreate({ id: 'real-1', tripId: 't1', name: 'A' });
    await Promise.all([first, second]);

    expect(createActivity).toHaveBeenCalledTimes(1);
  });
});
