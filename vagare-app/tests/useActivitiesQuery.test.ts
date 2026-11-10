import { renderHook, waitFor } from '@testing-library/react-native';

import { useActivitiesQuery } from '@/hooks/useActivitiesQuery';
import { listActivities } from '@/services/activities';
import { buildActivity } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/activities');

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
});
