import { renderHook, waitFor } from '@testing-library/react-native';

import { useTripsQuery } from '@/hooks/useTripsQuery';
import { ApiError } from '@/services/api';
import { getPendingTripDeletionIds } from '@/services/syncQueue';
import { listTrips } from '@/services/trips';
import { prefetchTripsForOffline } from '@/services/offlinePrefetch';
import { getCachedTrips, getLocalOnlyTrips, saveTripsToCache } from '@/services/tripsCache';
import { buildTrip } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/trips');
jest.mock('@/services/tripsCache');
jest.mock('@/services/syncQueue', () => ({ getPendingTripDeletionIds: jest.fn() }));
jest.mock('@/services/offlinePrefetch', () => ({
  prefetchTripsForOffline: jest.fn().mockResolvedValue(undefined),
}));

const listTripsMock = listTrips as jest.Mock;
const getCachedTripsMock = getCachedTrips as jest.Mock;
const saveTripsToCacheMock = saveTripsToCache as jest.Mock;
const getLocalOnlyTripsMock = getLocalOnlyTrips as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getLocalOnlyTripsMock.mockResolvedValue([]);
  (getPendingTripDeletionIds as jest.Mock).mockResolvedValue(new Set());
});

describe('useTripsQuery', () => {
  it('busca as viagens da API e salva no cache local', async () => {
    const trips = [buildTrip()];
    listTripsMock.mockResolvedValue(trips);
    saveTripsToCacheMock.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useTripsQuery(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listTripsMock).toHaveBeenCalledWith('test-token');
    expect(saveTripsToCacheMock).toHaveBeenCalledWith(trips);
    expect(prefetchTripsForOffline).toHaveBeenCalledWith('test-token', trips);
    expect(result.current.data).toEqual({ trips, isOffline: false });
  });

  it('inclui viagens criadas offline ainda não sincronizadas, ordenadas por data', async () => {
    const serverTrip = buildTrip({ id: 'trip-1', startDate: '2026-03-01' });
    const localTrip = buildTrip({ id: 'local-1', startDate: '2026-02-01' });
    listTripsMock.mockResolvedValue([serverTrip]);
    getLocalOnlyTripsMock.mockResolvedValue([localTrip]);

    const { result } = await renderHook(() => useTripsQuery(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.trips).toEqual([localTrip, serverTrip]);
    // Prefetch só faz sentido para viagens que existem no servidor.
    expect(prefetchTripsForOffline).toHaveBeenCalledWith('test-token', [serverTrip]);
  });

  it('esconde viagens excluídas offline cujo DELETE ainda está na fila', async () => {
    const kept = buildTrip({ id: 'trip-1' });
    const deleted = buildTrip({ id: 'trip-2' });
    listTripsMock.mockResolvedValue([kept, deleted]);
    (getPendingTripDeletionIds as jest.Mock).mockResolvedValue(new Set(['trip-2']));

    const { result } = await renderHook(() => useTripsQuery(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.trips).toEqual([kept]);
    expect(saveTripsToCacheMock).toHaveBeenCalledWith([kept]);
  });

  it('usa o cache local quando a API está offline e há viagens salvas', async () => {
    const cachedTrips = [buildTrip({ id: 'trip-cached' })];
    listTripsMock.mockRejectedValue(new ApiError(0, 'Sem conexão'));
    getCachedTripsMock.mockResolvedValue(cachedTrips);

    const { result } = await renderHook(() => useTripsQuery(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ trips: cachedTrips, isOffline: true });
  });

  it('propaga erro quando está offline e não há nada em cache', async () => {
    listTripsMock.mockRejectedValue(new ApiError(0, 'Sem conexão'));
    getCachedTripsMock.mockResolvedValue([]);

    const { result } = await renderHook(() => useTripsQuery(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ApiError);
  });
});
