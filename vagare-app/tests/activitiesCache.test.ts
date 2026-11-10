import {
  clearActivitiesCache,
  getCachedActivities,
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
