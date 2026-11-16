import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';

import { RECONNECT_CHECK_INTERVAL_MS, useSyncQueueDrain } from '@/hooks/useSyncQueueDrain';
import { pingServer } from '@/services/api';
import { onBackOnline } from '@/services/connectivity';
import { logError } from '@/services/logger';
import { drainPendingMutations, hasPendingMutations } from '@/services/syncQueue';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'token-123' }),
}));

jest.mock('@/services/connectivity', () => ({
  onBackOnline: jest.fn(),
}));

jest.mock('@/services/logger', () => ({
  logError: jest.fn(),
}));

jest.mock('@/services/syncQueue', () => ({
  drainPendingMutations: jest.fn(),
  hasPendingMutations: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  pingServer: jest.fn(),
}));

let appStateListener: (state: AppStateStatus) => void = () => {};
const removeAppStateListener = jest.fn();

describe('useSyncQueueDrain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (onBackOnline as jest.Mock).mockReturnValue(jest.fn());
    (drainPendingMutations as jest.Mock).mockResolvedValue(undefined);
    (hasPendingMutations as jest.Mock).mockResolvedValue(false);
    (pingServer as jest.Mock).mockResolvedValue(true);
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      appStateListener = listener as (state: AppStateStatus) => void;
      return { remove: removeAppStateListener };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ao voltar para o primeiro plano com pendências, testa o servidor', async () => {
    (hasPendingMutations as jest.Mock).mockResolvedValue(true);
    await renderHook(() => useSyncQueueDrain());

    await act(async () => appStateListener('active'));

    await waitFor(() => expect(pingServer).toHaveBeenCalledTimes(1));
  });

  it('não testa o servidor quando a fila está vazia', async () => {
    await renderHook(() => useSyncQueueDrain());

    await act(async () => appStateListener('active'));

    await waitFor(() => expect(hasPendingMutations).toHaveBeenCalled());
    expect(pingServer).not.toHaveBeenCalled();
  });

  it('testa o servidor periodicamente enquanto houver pendências e para ao desmontar', async () => {
    jest.useFakeTimers();
    (hasPendingMutations as jest.Mock).mockResolvedValue(true);
    const { unmount } = await renderHook(() => useSyncQueueDrain());

    await act(async () => {
      jest.advanceTimersByTime(RECONNECT_CHECK_INTERVAL_MS);
    });
    expect(pingServer).toHaveBeenCalledTimes(1);

    await act(async () => unmount());
    expect(removeAppStateListener).toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(RECONNECT_CHECK_INTERVAL_MS * 2);
    });
    expect(pingServer).toHaveBeenCalledTimes(1);
  });

  it('registra o erro com logError quando a drenagem na montagem rejeita, sem deixá-lo sem tratamento', async () => {
    const error = new Error('network down');
    (drainPendingMutations as jest.Mock).mockRejectedValue(error);

    renderHook(() => useSyncQueueDrain());

    await waitFor(() => expect(logError).toHaveBeenCalledWith('useSyncQueueDrain', error));
  });

  it('registra o erro com logError quando a drenagem disparada por onBackOnline rejeita', async () => {
    let backOnlineCallback: () => void = () => {};
    (onBackOnline as jest.Mock).mockImplementation((callback: () => void) => {
      backOnlineCallback = callback;
      return jest.fn();
    });
    (drainPendingMutations as jest.Mock).mockResolvedValueOnce(undefined);

    renderHook(() => useSyncQueueDrain());
    await waitFor(() => expect(drainPendingMutations).toHaveBeenCalledTimes(1));

    const error = new Error('401 unauthorized');
    (drainPendingMutations as jest.Mock).mockRejectedValueOnce(error);
    backOnlineCallback();

    await waitFor(() => expect(logError).toHaveBeenCalledWith('useSyncQueueDrain', error));
  });
});
