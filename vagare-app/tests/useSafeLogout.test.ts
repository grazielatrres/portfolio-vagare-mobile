import { act, renderHook } from '@testing-library/react-native';

import { useSafeLogout } from '@/hooks/useSafeLogout';
import { pingServer } from '@/services/api';
import { countPendingMutations, drainPendingMutations } from '@/services/syncQueue';

const mockLogout = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'token-1', logout: mockLogout }),
}));

jest.mock('@/services/api', () => ({ pingServer: jest.fn() }));

jest.mock('@/services/syncQueue', () => ({
  countPendingMutations: jest.fn(),
  drainPendingMutations: jest.fn(),
}));

const countMock = countPendingMutations as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (drainPendingMutations as jest.Mock).mockResolvedValue(undefined);
});

describe('useSafeLogout', () => {
  it('sem pendências, sai direto sem testar o servidor', async () => {
    countMock.mockResolvedValue(0);
    const { result } = await renderHook(() => useSafeLogout());

    await act(() => result.current.requestLogout());

    expect(pingServer).not.toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(result.current.unsyncedCount).toBe(0);
  });

  it('com pendências e conexão, sincroniza antes e sai se tudo foi enviado', async () => {
    countMock.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    (pingServer as jest.Mock).mockResolvedValue(true);
    const { result } = await renderHook(() => useSafeLogout());

    await act(() => result.current.requestLogout());

    expect(drainPendingMutations).toHaveBeenCalledWith('token-1');
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('com pendências e sem conexão, pede confirmação em vez de sair', async () => {
    countMock.mockResolvedValue(3);
    (pingServer as jest.Mock).mockResolvedValue(false);
    const { result } = await renderHook(() => useSafeLogout());

    await act(() => result.current.requestLogout());

    expect(drainPendingMutations).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
    expect(result.current.unsyncedCount).toBe(3);
  });

  it('confirmar sai mesmo assim; cancelar fecha o aviso sem sair', async () => {
    countMock.mockResolvedValue(1);
    (pingServer as jest.Mock).mockResolvedValue(false);
    const { result } = await renderHook(() => useSafeLogout());

    await act(() => result.current.requestLogout());
    await act(async () => result.current.cancelLogout());
    expect(result.current.unsyncedCount).toBe(0);
    expect(mockLogout).not.toHaveBeenCalled();

    await act(() => result.current.requestLogout());
    await act(() => result.current.confirmLogout());
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(result.current.unsyncedCount).toBe(0);
  });
});
