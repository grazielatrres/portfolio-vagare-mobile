import { renderHook, waitFor } from '@testing-library/react-native';

import { useDeleteTripMutation } from '@/hooks/useDeleteTripMutation';
import { tripsQueryKey } from '@/hooks/useTripsQuery';
import { queryClient } from '@/services/queryClient';
import { ApiError } from '@/services/api';
import { discardLocalEntity, queueTripDeletion } from '@/services/syncQueue';
import { deleteTrip } from '@/services/trips';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/trips');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/ToastContext', () => require('./helpers/mockToast').toastContextMock);
jest.mock('@/services/syncQueue', () => ({
  discardLocalEntity: jest.fn(),
  queueTripDeletion: jest.fn(),
  isLocalId: (id: string) => id.startsWith('local-'),
}));

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

  it('descarta localmente uma viagem criada offline, sem chamar a API', async () => {
    const { result } = await renderHook(() => useDeleteTripMutation(), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate('local-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(discardLocalEntity).toHaveBeenCalledWith('trip', 'local-1');
    expect(deleteTripMock).not.toHaveBeenCalled();
  });

  it('sem conexão, enfileira a exclusão de uma viagem do servidor em vez de falhar', async () => {
    deleteTripMock.mockRejectedValue(new ApiError(0, 'Sem conexão'));

    const { result } = await renderHook(() => useDeleteTripMutation(), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate('trip-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queueTripDeletion).toHaveBeenCalledWith('trip-1');
  });

  it('propaga erros reais do servidor', async () => {
    deleteTripMock.mockRejectedValue(new ApiError(403, 'Proibido'));

    const { result } = await renderHook(() => useDeleteTripMutation(), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate('trip-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queueTripDeletion).not.toHaveBeenCalled();
  });
});
