import { renderHook, waitFor } from '@testing-library/react-native';

import { activitiesQueryKey } from '@/hooks/useActivitiesQuery';
import { budgetQueryKey } from '@/hooks/useBudgetQuery';
import { useDeleteActivityMutation } from '@/hooks/useDeleteActivityMutation';
import { deleteActivity } from '@/services/activities';
import { UnsyncedEntityError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { discardLocalEntity, enqueueMutation, resolveSyncedId } from '@/services/syncQueue';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/ToastContext', () => require('./helpers/mockToast').toastContextMock);
jest.mock('@/services/activities');
jest.mock('@/services/activitiesCache');
jest.mock('@/services/syncQueue', () => ({
  discardLocalEntity: jest.fn(),
  enqueueMutation: jest.fn(),
  isLocalId: (id: string) => id.startsWith('local-'),
  resolveSyncedId: jest.fn((id: string) => id),
}));

const deleteActivityMock = deleteActivity as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDeleteActivityMutation', () => {
  it('exclui a atividade e invalida o roteiro e o orçamento da viagem', async () => {
    deleteActivityMock.mockResolvedValue(undefined);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useDeleteActivityMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate('activity-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteActivityMock).toHaveBeenCalledWith('test-token', 'trip-1', 'activity-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: activitiesQueryKey('trip-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetQueryKey('trip-1') });

    invalidateSpy.mockRestore();
  });

  it('com internet, exclui só no aparelho um item criado offline que ainda não sincronizou', async () => {
    deleteActivityMock.mockRejectedValue(new UnsyncedEntityError());

    const { result } = await renderHook(() => useDeleteActivityMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate('local-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(discardLocalEntity).toHaveBeenCalledWith('activity', 'local-1');
    expect(enqueueMutation).not.toHaveBeenCalled();
  });

  it('usa o id real quando o item criado offline já sincronizou', async () => {
    deleteActivityMock.mockResolvedValue(undefined);
    (resolveSyncedId as jest.Mock).mockImplementation((id: string) =>
      id === 'local-1' ? 'real-1' : id,
    );

    const { result } = await renderHook(() => useDeleteActivityMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate('local-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteActivityMock).toHaveBeenCalledWith('test-token', 'trip-1', 'real-1');
  });
});
