import { renderHook, waitFor } from '@testing-library/react-native';

import { useCreateTripMutation } from '@/hooks/useCreateTripMutation';
import { tripsQueryKey } from '@/hooks/useTripsQuery';
import { queryClient } from '@/services/queryClient';
import { createTrip } from '@/services/trips';
import { buildTrip } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/trips');

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
});
