import { renderHook, waitFor } from '@testing-library/react-native';

import { tripQueryKey } from '@/hooks/useTripQuery';
import { tripsQueryKey } from '@/hooks/useTripsQuery';
import { useUpdateTripMutation } from '@/hooks/useUpdateTripMutation';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation } from '@/services/syncQueue';
import { updateTrip } from '@/services/trips';
import { upsertTripToCache } from '@/services/tripsCache';
import { OFFLINE_SAVED_TOAST } from '@/utils/offlineToasts';
import { buildTrip } from './helpers/fixtures';
import { showToastMock } from './helpers/mockToast';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/ToastContext', () => require('./helpers/mockToast').toastContextMock);
jest.mock('@/services/trips', () => ({
  ...jest.requireActual('@/services/trips'),
  updateTrip: jest.fn(),
}));
jest.mock('@/services/tripsCache');
jest.mock('@/services/syncQueue', () => ({
  enqueueMutation: jest.fn(),
  resolveSyncedId: (id: string) => id,
}));

const updateTripMock = updateTrip as jest.Mock;

const payload = {
  name: 'Férias editadas',
  destination: 'Lisboa',
  latitude: 38.72,
  longitude: -9.14,
  startDate: '2026-12-02',
  endDate: '2026-12-12',
  budget: 4500,
  currency: 'EUR' as const,
  numberOfPeople: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useUpdateTripMutation', () => {
  it('envia o payload completo, atualiza o cache e invalida a viagem e a lista', async () => {
    const trip = buildTrip();
    const updated = buildTrip({ name: payload.name });
    updateTripMock.mockResolvedValue(updated);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useUpdateTripMutation(trip), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate(payload);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateTripMock).toHaveBeenCalledWith('test-token', trip.id, payload);
    expect(upsertTripToCache).toHaveBeenCalledWith(updated);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tripsQueryKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tripQueryKey(trip.id) });
    expect(enqueueMutation).not.toHaveBeenCalled();

    invalidateSpy.mockRestore();
  });

  it('sem conexão, salva a edição localmente e enfileira a atualização', async () => {
    const trip = buildTrip({ createdAt: '2026-01-01T00:00:00.000Z' });
    updateTripMock.mockRejectedValue(new ApiError(0, 'Sem conexão'));

    const { result } = await renderHook(() => useUpdateTripMutation(trip), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate(payload);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      id: trip.id,
      userId: trip.userId,
      name: payload.name,
      currency: 'EUR',
      budget: '4500',
      createdAt: trip.createdAt,
    });
    expect(upsertTripToCache).toHaveBeenCalledWith(result.current.data);
    expect(enqueueMutation).toHaveBeenCalledWith({
      tripId: trip.id,
      entityType: 'trip',
      operation: 'update',
      localId: trip.id,
      payload,
    });
    expect(showToastMock).toHaveBeenCalledWith(OFFLINE_SAVED_TOAST);
  });

  it('repassa erros de validação do servidor sem enfileirar', async () => {
    updateTripMock.mockRejectedValue(new ApiError(400, 'Moeda não suportada'));

    const { result } = await renderHook(() => useUpdateTripMutation(buildTrip()), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate(payload);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({ status: 400, message: 'Moeda não suportada' });
    expect(enqueueMutation).not.toHaveBeenCalled();
  });
});
