import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { clearActivitiesCache } from '@/services/activitiesCache';
import { ApiError, setTokenRefresher } from '@/services/api';
import { refreshSession } from '@/services/auth';
import { clearExpensesCache } from '@/services/expensesCache';
import { clearInfosCache } from '@/services/infosCache';
import { queryClient } from '@/services/queryClient';
import { clearPendingMutations } from '@/services/syncQueue';
import { clearTripsCache } from '@/services/tripsCache';
import { deleteMe } from '@/services/users';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@/services/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
  googleLogin: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshSession: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  ApiError: jest.requireActual('@/services/api').ApiError,
  setTokenRefresher: jest.fn(),
}));

jest.mock('@/services/users', () => ({
  deleteMe: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/tripsCache', () => ({
  clearTripsCache: jest.fn(),
}));

jest.mock('@/services/activitiesCache', () => ({
  clearActivitiesCache: jest.fn(),
}));

jest.mock('@/services/expensesCache', () => ({
  clearExpensesCache: jest.fn(),
}));

jest.mock('@/services/infosCache', () => ({
  clearInfosCache: jest.fn(),
}));

jest.mock('@/services/syncQueue', () => ({
  clearPendingMutations: jest.fn(),
}));

jest.mock('@/services/queryClient', () => ({
  queryClient: { clear: jest.fn() },
}));

const TOKEN_KEY = 'vagare.auth.token';
const USER_KEY = 'vagare.auth.user';
const REFRESH_TOKEN_KEY = 'vagare.auth.refreshToken';

describe('AuthContext - limpeza local em logout/deleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === TOKEN_KEY) return Promise.resolve('tok-1');
      if (key === USER_KEY) {
        return Promise.resolve(
          JSON.stringify({ id: 'u1', name: 'Graziela', email: 'g@vagare.app', provider: 'local' }),
        );
      }
      return Promise.resolve(null);
    });
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    (clearTripsCache as jest.Mock).mockResolvedValue(undefined);
    (clearActivitiesCache as jest.Mock).mockResolvedValue(undefined);
    (clearExpensesCache as jest.Mock).mockResolvedValue(undefined);
    (clearInfosCache as jest.Mock).mockResolvedValue(undefined);
    (clearPendingMutations as jest.Mock).mockResolvedValue(undefined);
    (deleteMe as jest.Mock).mockResolvedValue(undefined);
  });

  it('logout limpa sessão, todos os caches e queryClient mesmo se clearTripsCache falhar', async () => {
    (clearTripsCache as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isRestoring).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(clearTripsCache).toHaveBeenCalled();
    expect(clearActivitiesCache).toHaveBeenCalled();
    expect(clearExpensesCache).toHaveBeenCalled();
    expect(clearInfosCache).toHaveBeenCalled();
    expect(clearPendingMutations).toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(USER_KEY);
    expect(queryClient.clear).toHaveBeenCalled();
  });

  it('deleteAccount limpa sessão, todos os caches e queryClient mesmo se clearTripsCache falhar', async () => {
    (clearTripsCache as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isRestoring).toBe(false));

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(clearTripsCache).toHaveBeenCalled();
    expect(clearActivitiesCache).toHaveBeenCalled();
    expect(clearExpensesCache).toHaveBeenCalled();
    expect(clearInfosCache).toHaveBeenCalled();
    expect(clearPendingMutations).toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(USER_KEY);
    expect(queryClient.clear).toHaveBeenCalled();
  });

  it('deleteAccount não limpa estado local se a exclusão no servidor falhar', async () => {
    (deleteMe as jest.Mock).mockRejectedValue(new Error('rede indisponível'));

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isRestoring).toBe(false));

    await act(async () => {
      await expect(result.current.deleteAccount()).rejects.toThrow('rede indisponível');
    });

    expect(clearTripsCache).not.toHaveBeenCalled();
    expect(clearActivitiesCache).not.toHaveBeenCalled();
    expect(clearExpensesCache).not.toHaveBeenCalled();
    expect(clearInfosCache).not.toHaveBeenCalled();
    expect(clearPendingMutations).not.toHaveBeenCalled();
    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});

describe('AuthContext - renovação do token via refresh token', () => {
  const storedUser = { id: 'u1', name: 'Graziela', email: 'g@vagare.app', provider: 'local' };

  function getRefresher(): (token: string) => Promise<string | null> {
    const calls = (setTokenRefresher as jest.Mock).mock.calls;
    const refresher = calls.map(([r]) => r).filter(Boolean).pop();
    if (!refresher) throw new Error('nenhum refresher registrado');
    return refresher;
  }

  function mockStoredSession(refreshToken: string | null) {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === TOKEN_KEY) return Promise.resolve('tok-expirado');
      if (key === USER_KEY) return Promise.resolve(JSON.stringify(storedUser));
      if (key === REFRESH_TOKEN_KEY) return Promise.resolve(refreshToken);
      return Promise.resolve(null);
    });
  }

  async function renderRestored() {
    const hook = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(hook.result.current.token).toBe('tok-expirado'));
    return hook;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockStoredSession('refresh-1');
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    (clearTripsCache as jest.Mock).mockResolvedValue(undefined);
    (clearActivitiesCache as jest.Mock).mockResolvedValue(undefined);
    (clearExpensesCache as jest.Mock).mockResolvedValue(undefined);
    (clearInfosCache as jest.Mock).mockResolvedValue(undefined);
    (clearPendingMutations as jest.Mock).mockResolvedValue(undefined);
  });

  it('troca o token expirado por um novo e mantém o usuário conectado', async () => {
    (refreshSession as jest.Mock).mockResolvedValue({
      token: 'tok-novo',
      refreshToken: 'refresh-2',
      user: storedUser,
    });
    const { result } = await renderRestored();

    let renewed: string | null = null;
    await act(async () => {
      renewed = await getRefresher()('tok-expirado');
    });

    expect(renewed).toBe('tok-novo');
    expect(refreshSession).toHaveBeenCalledWith('refresh-1');
    expect(result.current.token).toBe('tok-novo');
    expect(result.current.user).toEqual(storedUser);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(REFRESH_TOKEN_KEY, 'refresh-2');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, 'tok-novo');
    expect(queryClient.clear).not.toHaveBeenCalled();
  });

  it('faz uma única renovação quando várias requisições falham juntas', async () => {
    (refreshSession as jest.Mock).mockResolvedValue({
      token: 'tok-novo',
      refreshToken: 'refresh-2',
      user: storedUser,
    });
    await renderRestored();

    let results: (string | null)[] = [];
    await act(async () => {
      const refresher = getRefresher();
      results = await Promise.all([
        refresher('tok-expirado'),
        refresher('tok-expirado'),
        refresher('tok-expirado'),
      ]);
    });

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['tok-novo', 'tok-novo', 'tok-novo']);
  });

  it('devolve o token atual para um 401 atrasado de um token já renovado', async () => {
    (refreshSession as jest.Mock).mockResolvedValue({
      token: 'tok-novo',
      refreshToken: 'refresh-2',
      user: storedUser,
    });
    await renderRestored();

    await act(async () => {
      await getRefresher()('tok-expirado');
    });
    let late: string | null = null;
    await act(async () => {
      late = await getRefresher()('tok-expirado');
    });

    expect(late).toBe('tok-novo');
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('volta para o login quando o servidor recusa o refresh token', async () => {
    (refreshSession as jest.Mock).mockRejectedValue(new ApiError(401, 'Sessão expirada'));
    const { result } = await renderRestored();

    let renewed: string | null = 'x';
    await act(async () => {
      renewed = await getRefresher()('tok-expirado');
    });

    expect(renewed).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
    expect(queryClient.clear).toHaveBeenCalled();
  });

  it('mantém a sessão quando não há conexão para renovar', async () => {
    (refreshSession as jest.Mock).mockRejectedValue(new ApiError(0, 'sem conexão'));
    const { result } = await renderRestored();

    await act(async () => {
      await expect(getRefresher()('tok-expirado')).rejects.toMatchObject({ status: 0 });
    });

    expect(result.current.token).toBe('tok-expirado');
    expect(result.current.user).toEqual(storedUser);
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('volta para o login quando a sessão salva não tem refresh token (versão antiga do app)', async () => {
    mockStoredSession(null);
    const { result } = await renderRestored();

    let renewed: string | null = 'x';
    await act(async () => {
      renewed = await getRefresher()('tok-expirado');
    });

    expect(renewed).toBeNull();
    expect(refreshSession).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
