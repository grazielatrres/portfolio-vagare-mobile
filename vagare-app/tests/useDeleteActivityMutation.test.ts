import { renderHook, waitFor } from '@testing-library/react-native';

import { activitiesQueryKey } from '@/hooks/useActivitiesQuery';
import { budgetQueryKey } from '@/hooks/useBudgetQuery';
import { useDeleteActivityMutation } from '@/hooks/useDeleteActivityMutation';
import { queryClient } from '@/services/queryClient';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/activities');

import { deleteActivity } from '@/services/activities';

const deleteActivityMock = deleteActivity as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDeleteActivityMutation', () => {
  it('exclui a atividade e invalida o roteiro e o orçamento da viagem', async () => {
    deleteActivityMock.mockResolvedValue(undefined);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteActivityMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate('activity-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteActivityMock).toHaveBeenCalledWith('test-token', 'trip-1', 'activity-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: activitiesQueryKey('trip-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetQueryKey('trip-1') });

    invalidateSpy.mockRestore();
  });
});
