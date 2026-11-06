import { renderHook, waitFor } from '@testing-library/react-native';

import { useTripQuery } from '@/hooks/useTripQuery';
import { buildTrip } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/trips');

import { getTrip } from '@/services/trips';

const getTripMock = getTrip as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useTripQuery', () => {
  it('busca a viagem pelo id usando o token do usuário', async () => {
    const trip = buildTrip({ id: 'trip-42' });
    getTripMock.mockResolvedValue(trip);

    const { result } = renderHook(() => useTripQuery('trip-42'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getTripMock).toHaveBeenCalledWith('test-token', 'trip-42');
    expect(result.current.data).toEqual(trip);
  });

  it('não dispara a busca quando o id está vazio', () => {
    const { result } = renderHook(() => useTripQuery(''), { wrapper: createQueryWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getTripMock).not.toHaveBeenCalled();
  });
});
