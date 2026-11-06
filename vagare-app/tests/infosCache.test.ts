jest.mock('@/services/database', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '@/services/database';
import {
  clearInfosCache,
  getCachedInfos,
  removeInfoFromCache,
  saveInfosToCache,
  upsertInfoToCache,
} from '@/services/infosCache';

const info = {
  id: 'i1',
  tripId: 't1',
  type: 'flight' as const,
  title: 'Voo de ida',
  description: null,
  date: '2026-01-01',
  details: { flightNumber: 'LA123' },
};

describe('infosCache — nunca propaga erro de SQLite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));
  });

  it('getCachedInfos resolve [] em falha', async () => {
    await expect(getCachedInfos('t1')).resolves.toEqual([]);
  });

  it('saveInfosToCache resolve undefined em falha', async () => {
    await expect(saveInfosToCache('t1', [info])).resolves.toBeUndefined();
  });

  it('upsertInfoToCache resolve undefined em falha', async () => {
    await expect(upsertInfoToCache(info)).resolves.toBeUndefined();
  });

  it('removeInfoFromCache resolve undefined em falha', async () => {
    await expect(removeInfoFromCache('i1')).resolves.toBeUndefined();
  });

  it('clearInfosCache resolve undefined em falha', async () => {
    await expect(clearInfosCache()).resolves.toBeUndefined();
  });
});

describe('infosCache — serialização do campo details (JSON)', () => {
  it('getCachedInfos faz parse de details armazenado como TEXT', async () => {
    const db = {
      getAllAsync: jest.fn().mockResolvedValue([
        { ...info, details: JSON.stringify(info.details) },
      ]),
    };
    (getDatabase as jest.Mock).mockResolvedValue(db);

    await expect(getCachedInfos('t1')).resolves.toEqual([info]);
  });

  it('upsertInfoToCache grava details como JSON string', async () => {
    const db = { runAsync: jest.fn().mockResolvedValue(undefined) };
    (getDatabase as jest.Mock).mockResolvedValue(db);

    await upsertInfoToCache(info);

    const params = db.runAsync.mock.calls[0][1];
    expect(params[params.length - 1]).toBe(JSON.stringify(info.details));
  });
});
