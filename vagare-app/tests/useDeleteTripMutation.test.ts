import { renderHook, waitFor } from '@testing-library/react-native';

import { useDeleteTripMutation } from '@/hooks/useDeleteTripMutation';
import { tripsQueryKey } from '@/hooks/useTripsQuery';
import { queryClient } from '@/services/queryClient';
import { deleteTrip } from '@/services/trips';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/trips');

const deleteTripMock = deleteTrip as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDeleteTripMutation', () => {
  it('exclui a viagem pelo id e invalida a lista de viagens', async () => {
    deleteTripMock.mockResolvedValue(undefined);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useDeleteTripMutation(), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate('trip-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteTripMock).toHaveBeenCalledWith('test-token', 'trip-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tripsQueryKey });

    invalidateSpy.mockRestore();
  });
});
