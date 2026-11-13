import { renderHook, waitFor } from '@testing-library/react-native';

import { useActivitiesQuery } from '@/hooks/useActivitiesQuery';
import { listActivities } from '@/services/activities';
import { getCachedActivities } from '@/services/activitiesCache';
import { ApiError } from '@/services/api';
import { buildActivity } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/activities');
jest.mock('@/services/activitiesCache');

const listActivitiesMock = listActivities as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useActivitiesQuery', () => {
  it('busca as atividades da viagem', async () => {
    const activities = [buildActivity()];
    listActivitiesMock.mockResolvedValue(activities);

    const { result } = await renderHook(() => useActivitiesQuery('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listActivitiesMock).toHaveBeenCalledWith('test-token', 'trip-1');
    expect(result.current.data).toEqual({ activities, isOffline: false });
  });

  it('offline com cache vazio mostra roteiro vazio em vez de erro (permite adicionar offline)', async () => {
    listActivitiesMock.mockRejectedValue(new ApiError(0, 'Sem conexão'));
    (getCachedActivities as jest.Mock).mockResolvedValue([]);

    const { result } = await renderHook(() => useActivitiesQuery('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ activities: [], isOffline: true });
  });
});
