import { renderHook, waitFor } from '@testing-library/react-native';

import { useSyncQueueDrain } from '@/hooks/useSyncQueueDrain';
import { onBackOnline } from '@/services/connectivity';
import { logError } from '@/services/logger';
import { drainPendingMutations } from '@/services/syncQueue';

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
}));

describe('useSyncQueueDrain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (onBackOnline as jest.Mock).mockReturnValue(jest.fn());
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
