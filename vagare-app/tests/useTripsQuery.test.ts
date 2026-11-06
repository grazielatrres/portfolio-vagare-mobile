import { renderHook, waitFor } from '@testing-library/react-native';

import { useTripsQuery } from '@/hooks/useTripsQuery';
import { ApiError } from '@/services/api';
import { listTrips } from '@/services/trips';
import { getCachedTrips, saveTripsToCache } from '@/services/tripsCache';
import { buildTrip } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/trips');
jest.mock('@/services/tripsCache');

const listTripsMock = listTrips as jest.Mock;
const getCachedTripsMock = getCachedTrips as jest.Mock;
const saveTripsToCacheMock = saveTripsToCache as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
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
    expect(result.current.data).toEqual({ trips, isOffline: false });
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
