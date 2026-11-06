import { renderHook, waitFor } from '@testing-library/react-native';

import { activitiesQueryKey } from '@/hooks/useActivitiesQuery';
import { budgetQueryKey } from '@/hooks/useBudgetQuery';
import { useCreateActivityMutation } from '@/hooks/useCreateActivityMutation';
import { queryClient } from '@/services/queryClient';
import { buildActivity } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/activities');

import { createActivity } from '@/services/activities';

const createActivityMock = createActivity as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCreateActivityMutation', () => {
  it('cria a atividade e invalida o roteiro e o orçamento da viagem', async () => {
    const activity = buildActivity();
    createActivityMock.mockResolvedValue(activity);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateActivityMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    const payload = { name: activity.name, date: activity.date };
    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createActivityMock).toHaveBeenCalledWith('test-token', 'trip-1', payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: activitiesQueryKey('trip-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetQueryKey('trip-1') });

    invalidateSpy.mockRestore();
  });
});
