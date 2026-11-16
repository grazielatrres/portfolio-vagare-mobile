import { listActivities } from '@/services/activities';
import { saveActivitiesToCache } from '@/services/activitiesCache';
import { ApiError } from '@/services/api';
import { getBudgetSummary } from '@/services/budget';
import { saveExpensesToCache } from '@/services/expensesCache';
import { listInfos } from '@/services/infos';
import { saveInfosToCache } from '@/services/infosCache';
import { prefetchTripsForOffline, resetOfflinePrefetch } from '@/services/offlinePrefetch';
import { buildBudgetSummary, buildTrip } from './helpers/fixtures';

jest.mock('@/services/activities');
jest.mock('@/services/activitiesCache');
jest.mock('@/services/budget');
jest.mock('@/services/expensesCache');
jest.mock('@/services/infos');
jest.mock('@/services/infosCache');
jest.mock('@/services/logger');

describe('prefetchTripsForOffline', () => {
  const trips = [buildTrip({ id: 't1' }), buildTrip({ id: 't2' })];

  beforeEach(() => {
    jest.clearAllMocks();
    resetOfflinePrefetch();
    (listActivities as jest.Mock).mockResolvedValue([]);
    (listInfos as jest.Mock).mockResolvedValue([]);
    (getBudgetSummary as jest.Mock).mockResolvedValue(buildBudgetSummary());
  });

  it('salva roteiro, informações e despesas de todas as viagens no cache', async () => {
    await prefetchTripsForOffline('tok', trips);

    for (const id of ['t1', 't2']) {
      expect(saveActivitiesToCache).toHaveBeenCalledWith(id, []);
      expect(saveInfosToCache).toHaveBeenCalledWith(id, []);
      expect(saveExpensesToCache).toHaveBeenCalledWith(id, expect.any(Array));
    }
  });

  it('não repete dentro do intervalo mínimo', async () => {
    await prefetchTripsForOffline('tok', trips);
    await prefetchTripsForOffline('tok', trips);

    expect(listActivities).toHaveBeenCalledTimes(2);
  });

  it('para ao perder a conexão e tenta de novo na próxima chamada', async () => {
    (listActivities as jest.Mock).mockRejectedValueOnce(new ApiError(0, 'sem conexão'));

    await prefetchTripsForOffline('tok', trips);
    expect(listActivities).toHaveBeenCalledTimes(1);

    await prefetchTripsForOffline('tok', trips);
    expect(listActivities).toHaveBeenCalledTimes(3);
  });
});
