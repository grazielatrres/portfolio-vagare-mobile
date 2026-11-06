import { renderHook, waitFor } from '@testing-library/react-native';

import { useWeatherQuery } from '@/hooks/useWeatherQuery';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/weather');

import { getTripWeather } from '@/services/weather';

const getTripWeatherMock = getTripWeather as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useWeatherQuery', () => {
  it('busca a previsão do tempo da viagem', async () => {
    const forecast = [
      { date: '2026-09-01', temperature: 24, condition: 'céu limpo', icon: '01d' },
    ];
    getTripWeatherMock.mockResolvedValue(forecast);

    const { result } = await renderHook(() => useWeatherQuery('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getTripWeatherMock).toHaveBeenCalledWith('test-token', 'trip-1');
    expect(result.current.data).toEqual(forecast);
  });

  it('não tenta novamente quando a busca falha', async () => {
    getTripWeatherMock.mockRejectedValue(new Error('falha na API de clima'));

    const { result } = await renderHook(() => useWeatherQuery('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(getTripWeatherMock).toHaveBeenCalledTimes(1);
  });
});
