import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
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
}));

jest.mock('@/services/users', () => ({
  deleteMe: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/tripsCache', () => ({
  clearTripsCache: jest.fn(),
}));

jest.mock('@/services/queryClient', () => ({
  queryClient: { clear: jest.fn() },
}));

const TOKEN_KEY = 'vagare.auth.token';
const USER_KEY = 'vagare.auth.user';

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
    (deleteMe as jest.Mock).mockResolvedValue(undefined);
  });

  it('logout limpa sessão e queryClient mesmo se clearTripsCache falhar', async () => {
    (clearTripsCache as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isRestoring).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(clearTripsCache).toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(USER_KEY);
    expect(queryClient.clear).toHaveBeenCalled();
  });

  it('deleteAccount limpa sessão e queryClient mesmo se clearTripsCache falhar', async () => {
    (clearTripsCache as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isRestoring).toBe(false));

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(clearTripsCache).toHaveBeenCalled();
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
    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});
