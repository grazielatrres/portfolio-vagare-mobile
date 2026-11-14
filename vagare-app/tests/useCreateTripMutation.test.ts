import { renderHook, waitFor } from '@testing-library/react-native';

import { useCreateTripMutation } from '@/hooks/useCreateTripMutation';
import { tripsQueryKey } from '@/hooks/useTripsQuery';
import { queryClient } from '@/services/queryClient';
import { ApiError } from '@/services/api';
import { enqueueMutation } from '@/services/syncQueue';
import { createTrip } from '@/services/trips';
import { upsertTripToCache } from '@/services/tripsCache';
import { buildTrip } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/ToastContext', () => require('./helpers/mockToast').toastContextMock);
jest.mock('@/services/trips', () => ({
  ...jest.requireActual('@/services/trips'),
  createTrip: jest.fn(),
}));
jest.mock('@/services/tripsCache');
jest.mock('@/services/syncQueue', () => ({
  enqueueMutation: jest.fn(),
  generateLocalId: () => 'local-trip-1',
}));

const createTripMock = createTrip as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCreateTripMutation', () => {
  it('cria a viagem com o payload informado e invalida a lista de viagens', async () => {
    const trip = buildTrip();
    createTripMock.mockResolvedValue(trip);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useCreateTripMutation(), {
      wrapper: createQueryWrapper(),
    });

    const payload = {
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
    };
    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createTripMock).toHaveBeenCalledWith('test-token', payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tripsQueryKey });

    invalidateSpy.mockRestore();
  });

  it('sem conexão, salva a viagem localmente e enfileira a criação', async () => {
    createTripMock.mockRejectedValue(new ApiError(0, 'Sem conexão'));

    const { result } = await renderHook(() => useCreateTripMutation(), {
      wrapper: createQueryWrapper(),
    });

    const payload = {
      name: 'Viagem offline',
      destination: 'Lisboa',
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      budget: 3000,
    };
    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      id: 'local-trip-1',
      name: 'Viagem offline',
      budget: '3000',
      currency: 'BRL',
    });
    expect(upsertTripToCache).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'local-trip-1' }),
    );
    expect(enqueueMutation).toHaveBeenCalledWith({
      tripId: 'local-trip-1',
      entityType: 'trip',
      operation: 'create',
      localId: 'local-trip-1',
      payload,
    });
  });

  it('propaga erros reais do servidor sem salvar localmente', async () => {
    createTripMock.mockRejectedValue(new ApiError(422, 'inválido'));

    const { result } = await renderHook(() => useCreateTripMutation(), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate({
      name: 'X',
      destination: 'Y',
      startDate: '2026-12-01',
      endDate: '2026-12-02',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(enqueueMutation).not.toHaveBeenCalled();
  });
});
