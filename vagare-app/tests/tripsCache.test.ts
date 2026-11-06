jest.mock('@/services/database', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '@/services/database';
import {
  clearTripsCache,
  getCachedTripById,
  getCachedTrips,
  saveTripsToCache,
} from '@/services/tripsCache';

const trip = {
  id: 't1',
  userId: 'u1',
  name: 'Grécia',
  destination: 'Atenas',
  latitude: null,
  longitude: null,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  budget: '5000',
  currency: 'BRL' as const,
  numberOfPeople: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('tripsCache — nunca propaga erro de SQLite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));
  });

  it('getCachedTrips resolve [] em falha', async () => {
    await expect(getCachedTrips()).resolves.toEqual([]);
  });

  it('getCachedTripById resolve null em falha', async () => {
    await expect(getCachedTripById('t1')).resolves.toBeNull();
  });

  it('saveTripsToCache resolve undefined em falha', async () => {
    await expect(saveTripsToCache([trip])).resolves.toBeUndefined();
  });

  it('clearTripsCache resolve undefined em falha', async () => {
    await expect(clearTripsCache()).resolves.toBeUndefined();
  });
});

describe('tripsCache — comportamento com banco saudável', () => {
  it('getCachedTripById filtra pela lista completa de trips', async () => {
    const db = { getAllAsync: jest.fn().mockResolvedValue([trip]) };
    (getDatabase as jest.Mock).mockResolvedValue(db);

    await expect(getCachedTripById('t1')).resolves.toEqual(trip);
    await expect(getCachedTripById('inexistente')).resolves.toBeNull();
  });
});
