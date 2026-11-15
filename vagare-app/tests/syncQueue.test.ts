import { createActivity, updateActivity } from '@/services/activities';
import { removeActivityFromCache } from '@/services/activitiesCache';
import { ApiError, UnsyncedEntityError } from '@/services/api';
import { getDatabase } from '@/services/database';
import { queryClient } from '@/services/queryClient';
import { createTrip, deleteTrip } from '@/services/trips';
import { removeTripFromCache, replaceLocalTrip } from '@/services/tripsCache';
import {
  discardLocalEntity,
  drainPendingMutations,
  enqueueMutation,
  getIsSyncing,
  getPendingMutations,
  clearPendingMutations,
  queueTripDeletion,
  resolveSyncedId,
  subscribeSyncStatus,
} from '@/services/syncQueue';

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

jest.mock('@/services/trips', () => ({
  createTrip: jest.fn(),
  deleteTrip: jest.fn(),
}));

jest.mock('@/services/tripsCache', () => ({
  replaceLocalTrip: jest.fn(),
  removeTripFromCache: jest.fn(),
}));

jest.mock('@/services/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));

function createFakeDb() {
  let rows: Record<string, unknown>[] = [];

  return {
    runAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      if (/INSERT INTO pending_mutations/i.test(sql)) {
        const [id, tripId, entityType, operation, localId, payload, createdAt] = params;
        rows.push({ id, tripId, entityType, operation, localId, payload, createdAt });
      } else if (/DELETE FROM pending_mutations WHERE id = \?/i.test(sql)) {
        rows = rows.filter((r) => r.id !== params[0]);
      } else if (/DELETE FROM pending_mutations WHERE localId = \?/i.test(sql)) {
        rows = rows.filter((r) => r.localId !== params[0]);
      } else if (/DELETE FROM pending_mutations WHERE tripId = \?/i.test(sql)) {
        rows = rows.filter((r) => r.tripId !== params[0]);
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

  beforeEach(async () => {
    jest.clearAllMocks();
    db = createFakeDb();
    (getDatabase as jest.Mock).mockResolvedValue(db);
    // Zera também o mapa de ids sincronizados entre os testes.
    await clearPendingMutations();
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
    // O item local de uma criação recusada sai do cache, senão fica órfão.
    expect(removeActivityFromCache).toHaveBeenCalledWith('local-1');
  });

  it('preserva a fila quando o token é recusado (401)', async () => {
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-1',
      payload: { name: 'A', date: '2026-01-01' },
    });

    (createActivity as jest.Mock).mockRejectedValueOnce(new ApiError(401, 'Token expirado'));

    await drainPendingMutations('token-1');

    await expect(getPendingMutations('t1')).resolves.toHaveLength(1);
    expect(removeActivityFromCache).not.toHaveBeenCalled();
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

  it('cria a viagem offline primeiro e remapeia o tripId dos itens criados dentro dela', async () => {
    const tripPayload = { name: 'Lisboa', destination: 'Lisboa', startDate: '2026-12-01', endDate: '2026-12-05' };
    await enqueueMutation({
      tripId: 'local-trip',
      entityType: 'trip',
      operation: 'create',
      localId: 'local-trip',
      payload: tripPayload,
    });
    await enqueueMutation({
      tripId: 'local-trip',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-act',
      payload: { name: 'A', date: '2026-12-02' },
    });

    const createdTrip = { id: 'real-trip', name: 'Lisboa' };
    (createTrip as jest.Mock).mockResolvedValue(createdTrip);
    (createActivity as jest.Mock).mockResolvedValue({ id: 'real-act', tripId: 'real-trip', name: 'A' });

    await drainPendingMutations('token-1');

    expect(createTrip).toHaveBeenCalledWith('token-1', tripPayload);
    expect(replaceLocalTrip).toHaveBeenCalledWith('local-trip', createdTrip);
    expect(resolveSyncedId('local-trip')).toBe('real-trip');
    // A tela aberta com o id local é recarregada para passar a usar o id real.
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['trips', 'local-trip'] });
    expect(createActivity).toHaveBeenCalledWith('token-1', 'real-trip', { name: 'A', date: '2026-12-02' });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['trips'], exact: true });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['trips', 'real-trip'] });
  });

  it('descarta a viagem local e seus itens quando o servidor rejeita a criação', async () => {
    await enqueueMutation({
      tripId: 'local-trip',
      entityType: 'trip',
      operation: 'create',
      localId: 'local-trip',
      payload: { name: '' },
    });
    await enqueueMutation({
      tripId: 'local-trip',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-act',
      payload: { name: 'A', date: '2026-12-02' },
    });

    (createTrip as jest.Mock).mockRejectedValueOnce(new ApiError(422, 'inválido'));

    await drainPendingMutations('token-1');

    expect(createActivity).not.toHaveBeenCalled();
    expect(removeTripFromCache).toHaveBeenCalledWith('local-trip');
    await expect(getPendingMutations('local-trip')).resolves.toEqual([]);
  });

  it('queueTripDeletion descarta pendências da viagem, limpa o cache e envia o DELETE ao drenar', async () => {
    await enqueueMutation({
      tripId: 'trip-1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-act',
      payload: { name: 'A', date: '2026-12-02' },
    });

    await queueTripDeletion('trip-1');

    expect(removeTripFromCache).toHaveBeenCalledWith('trip-1');
    const pending = await getPendingMutations('trip-1');
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ entityType: 'trip', operation: 'delete' });

    (deleteTrip as jest.Mock).mockResolvedValue(undefined);
    await drainPendingMutations('token-1');

    expect(createActivity).not.toHaveBeenCalled();
    expect(deleteTrip).toHaveBeenCalledWith('token-1', 'trip-1');
    await expect(getPendingMutations('trip-1')).resolves.toEqual([]);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['trips'], exact: true });
  });

  it('marca "sincronizando" só enquanto envia alterações e notifica a UI', async () => {
    const statuses: boolean[] = [];
    const unsubscribe = subscribeSyncStatus(() => statuses.push(getIsSyncing()));

    // Fila vazia: não liga o loading.
    await drainPendingMutations('token-1');
    expect(statuses).toEqual([]);

    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-1',
      payload: { name: 'A', date: '2026-01-01' },
    });
    let syncingDuringRequest = false;
    (createActivity as jest.Mock).mockImplementation(async () => {
      syncingDuringRequest = getIsSyncing();
      return { id: 'real-1', tripId: 't1', name: 'A' };
    });

    await drainPendingMutations('token-1');

    expect(syncingDuringRequest).toBe(true);
    expect(statuses).toEqual([true, false]);
    expect(getIsSyncing()).toBe(false);
    unsubscribe();
  });

  it('descarta a edição de um item cuja criação foi recusada, sem travar a fila', async () => {
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
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-2',
      payload: { name: 'B', date: '2026-01-02' },
    });

    (createActivity as jest.Mock)
      .mockRejectedValueOnce(new ApiError(422, 'inválido'))
      .mockResolvedValueOnce({ id: 'real-2', tripId: 't1', name: 'B' });
    // O id local-1 nunca vai existir no servidor: a api responde UnsyncedEntityError.
    (updateActivity as jest.Mock).mockRejectedValueOnce(new UnsyncedEntityError());

    await drainPendingMutations('token-1');

    expect(createActivity).toHaveBeenCalledTimes(2);
    await expect(getPendingMutations('t1')).resolves.toEqual([]);
  });

  it('resolve para o id real uma edição enfileirada depois que a criação já subiu', async () => {
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-1',
      payload: { name: 'A', date: '2026-01-01' },
    });
    (createActivity as jest.Mock).mockResolvedValue({ id: 'real-1', tripId: 't1', name: 'A' });
    await drainPendingMutations('token-1');

    // Edição feita com o id local que ainda estava na tela.
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'update',
      localId: 'local-1',
      payload: { name: 'A editada', date: '2026-01-01' },
    });
    (updateActivity as jest.Mock).mockResolvedValue({ id: 'real-1', tripId: 't1', name: 'A editada' });
    await drainPendingMutations('token-1');

    expect(updateActivity).toHaveBeenCalledWith('token-1', 't1', 'real-1', {
      name: 'A editada',
      date: '2026-01-01',
    });
  });

  it('não drena duas vezes em paralelo (guard isDraining)', async () => {
    await enqueueMutation({
      tripId: 't1',
      entityType: 'activity',
      operation: 'create',
      localId: 'local-1',
      payload: { name: 'A', date: '2026-01-01' },
    });

    (createActivity as jest.Mock).mockResolvedValue({ id: 'real-1', tripId: 't1', name: 'A' });

    // isDraining é marcado de forma síncrona no início de drainPendingMutations,
    // então a segunda chamada já retorna sem tocar no banco/rede.
    const first = drainPendingMutations('token-1');
    const second = drainPendingMutations('token-1');
    await Promise.all([first, second]);

    expect(createActivity).toHaveBeenCalledTimes(1);
  });
});
