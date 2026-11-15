import {
  clearActivitiesCache,
  getCachedActivities,
  getCachedActivityCounts,
  removeActivityFromCache,
  saveActivitiesToCache,
  upsertActivityToCache,
} from '@/services/activitiesCache';
import { getDatabase } from '@/services/database';

jest.mock('@/services/database', () => ({
  getDatabase: jest.fn(),
}));

const activity = {
  id: 'a1',
  tripId: 't1',
  name: 'Passeio',
  date: '2026-01-02',
  time: null,
  location: null,
  period: null,
  category: null,
  estimatedCost: '100',
  description: null,
};

describe('activitiesCache — nunca propaga erro de SQLite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));
  });

  it('getCachedActivities resolve [] em falha', async () => {
    await expect(getCachedActivities('t1')).resolves.toEqual([]);
  });

  it('saveActivitiesToCache resolve undefined em falha', async () => {
    await expect(saveActivitiesToCache('t1', [activity])).resolves.toBeUndefined();
  });

  it('upsertActivityToCache resolve undefined em falha', async () => {
    await expect(upsertActivityToCache(activity)).resolves.toBeUndefined();
  });

  it('removeActivityFromCache resolve undefined em falha', async () => {
    await expect(removeActivityFromCache('a1')).resolves.toBeUndefined();
  });

  it('clearActivitiesCache resolve undefined em falha', async () => {
    await expect(clearActivitiesCache()).resolves.toBeUndefined();
  });
});

describe('activitiesCache — contagem por viagem', () => {
  it('getCachedActivityCounts devolve um mapa tripId → quantidade', async () => {
    const db = {
      getAllAsync: jest.fn().mockResolvedValue([
        { tripId: 't1', total: 3 },
        { tripId: 'local-t2', total: 1 },
      ]),
    };
    (getDatabase as jest.Mock).mockResolvedValue(db);

    await expect(getCachedActivityCounts()).resolves.toEqual({ t1: 3, 'local-t2': 1 });
  });

  it('getCachedActivityCounts resolve {} em falha de SQLite', async () => {
    (getDatabase as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));
    await expect(getCachedActivityCounts()).resolves.toEqual({});
  });
});

describe('activitiesCache — itens com alteração offline pendente', () => {
  it('saveActivitiesToCache não apaga nem reinsere itens que ainda estão na fila', async () => {
    const db = {
      runAsync: jest.fn().mockResolvedValue(undefined),
      withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
    };
    (getDatabase as jest.Mock).mockResolvedValue(db);

    await saveActivitiesToCache('t1', [activity]);

    const [deleteSql] = db.runAsync.mock.calls[0];
    expect(deleteSql).toMatch(/NOT IN \(SELECT localId FROM pending_mutations\)/);

    const [insertSql, insertParams] = db.runAsync.mock.calls[1];
    expect(insertSql).toMatch(/WHERE NOT EXISTS \(SELECT 1 FROM pending_mutations WHERE localId = \?\)/);
    expect(insertParams[insertParams.length - 1]).toBe(activity.id);
  });
});

