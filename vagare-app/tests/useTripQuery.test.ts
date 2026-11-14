import { renderHook, waitFor } from '@testing-library/react-native';

import { useTripQuery } from '@/hooks/useTripQuery';
import { ApiError, UnsyncedTripError } from '@/services/api';
import { getSyncedTripId } from '@/services/syncQueue';
import { getTrip } from '@/services/trips';
import { getCachedTripById } from '@/services/tripsCache';
import { buildTrip } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/trips');
jest.mock('@/services/tripsCache');
jest.mock('@/services/syncQueue', () => ({
  getSyncedTripId: jest.fn(),
  isLocalId: (id: string) => id.startsWith('local-'),
}));

const getTripMock = getTrip as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useTripQuery', () => {
  it('busca a viagem pelo id usando o token do usuário', async () => {
    const trip = buildTrip({ id: 'trip-42' });
    getTripMock.mockResolvedValue(trip);

    const { result } = await renderHook(() => useTripQuery('trip-42'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getTripMock).toHaveBeenCalledWith('test-token', 'trip-42');
    expect(result.current.data).toEqual({ trip, isOffline: false });
  });

  it('viagem local ainda não sincronizada usa o cache sem marcar como offline', async () => {
    const local = buildTrip({ id: 'local-1' });
    getTripMock.mockRejectedValue(new UnsyncedTripError());
    (getCachedTripById as jest.Mock).mockResolvedValue(local);

    const { result } = await renderHook(() => useTripQuery('local-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ trip: local, isOffline: false });
  });

  it('marca como offline quando a falha é de rede de verdade', async () => {
    const cached = buildTrip({ id: 'trip-1' });
    getTripMock.mockRejectedValue(new ApiError(0, 'Sem conexão'));
    (getCachedTripById as jest.Mock).mockResolvedValue(cached);

    const { result } = await renderHook(() => useTripQuery('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ trip: cached, isOffline: true });
  });

  it('segue o id real de uma viagem local que já foi sincronizada', async () => {
    const synced = buildTrip({ id: 'real-1' });
    (getSyncedTripId as jest.Mock).mockReturnValue('real-1');
    getTripMock.mockResolvedValue(synced);

    const { result } = await renderHook(() => useTripQuery('local-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getTripMock).toHaveBeenCalledWith('test-token', 'real-1');
    expect(result.current.data?.trip.id).toBe('real-1');
  });

  it('não dispara a busca quando o id está vazio', async () => {
    const { result } = await renderHook(() => useTripQuery(''), { wrapper: createQueryWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getTripMock).not.toHaveBeenCalled();
  });
});
