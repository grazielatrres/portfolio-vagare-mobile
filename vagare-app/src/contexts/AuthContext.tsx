import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import {
  AuthResponse,
  AuthUser,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession as refreshSessionRequest,
  register as registerRequest,
} from '@/services/auth';
import { clearActivitiesCache } from '@/services/activitiesCache';
import { ApiError, setTokenRefresher } from '@/services/api';
import { clearExpensesCache } from '@/services/expensesCache';
import { clearInfosCache } from '@/services/infosCache';
import { logError } from '@/services/logger';
import { resetOfflinePrefetch } from '@/services/offlinePrefetch';
import { queryClient } from '@/services/queryClient';
import { clearPendingMutations } from '@/services/syncQueue';
import { clearTripsCache } from '@/services/tripsCache';
import { deleteMe } from '@/services/users';

const TOKEN_KEY = 'vagare.auth.token';
const USER_KEY = 'vagare.auth.user';
const REFRESH_TOKEN_KEY = 'vagare.auth.refreshToken';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const tokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    setTokenRefresher((rejectedToken) => {
      if (rejectedToken !== tokenRef.current) {
        return Promise.resolve(tokenRef.current);
      }
      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = renewSession().finally(() => {
          refreshPromiseRef.current = null;
        });
      }
      return refreshPromiseRef.current;
    });
    return () => setTokenRefresher(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const [storedToken, storedUser, storedRefreshToken] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      ]);

      if (storedToken && storedUser) {
        tokenRef.current = storedToken;
        refreshTokenRef.current = storedRefreshToken;
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      setIsRestoring(false);
    }

    restoreSession();
  }, []);

  async function persistSession({ token: nextToken, refreshToken, user: nextUser }: AuthResponse) {
    tokenRef.current = nextToken;
    refreshTokenRef.current = refreshToken;
    setToken(nextToken);
    setUser(nextUser);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
  }

  async function clearSession() {
    tokenRef.current = null;
    refreshTokenRef.current = null;
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }

  async function renewSession(): Promise<string | null> {
    const refreshToken = refreshTokenRef.current;
    if (!refreshToken) {
      await endExpiredSession();
      return null;
    }

    try {
      const response = await refreshSessionRequest(refreshToken);
      await persistSession(response);
      return response.token;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
        await endExpiredSession();
        return null;
      }
      throw error;
    }
  }

  async function endExpiredSession() {
    try {
      await clearLocalState();
    } catch (error) {
      logError('AuthContext.endExpiredSession', error);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const response = await loginRequest(email, password);
      await persistSession(response);
    } finally {
      setIsLoading(false);
    }
  }

  async function register(name: string, email: string, password: string) {
    setIsLoading(true);
    try {
      const response = await registerRequest(name, email, password);
      await persistSession(response);
    } finally {
      setIsLoading(false);
    }
  }

  async function loginWithGoogle(idToken: string) {
    setIsLoading(true);
    try {
      const response = await googleLoginRequest(idToken);
      await persistSession(response);
    } finally {
      setIsLoading(false);
    }
  }

  // Limpa todo o estado local em sequência, sem deixar a falha de um passo
  // impedir os seguintes. queryClient.clear() é a única garantia final: roda
  // no finally mesmo se algo acima lançar um erro inesperado.
  async function clearLocalState() {
    try {
      try {
        await clearSession();
      } catch (error) {
        logError('AuthContext.clearSession', error);
      }

      try {
        await clearTripsCache();
      } catch (error) {
        logError('AuthContext.clearTripsCache', error);
      }

      try {
        await clearActivitiesCache();
      } catch (error) {
        logError('AuthContext.clearActivitiesCache', error);
      }

      try {
        await clearExpensesCache();
      } catch (error) {
        logError('AuthContext.clearExpensesCache', error);
      }

      try {
        await clearInfosCache();
      } catch (error) {
        logError('AuthContext.clearInfosCache', error);
      }

      try {
        await clearPendingMutations();
      } catch (error) {
        logError('AuthContext.clearPendingMutations', error);
      }
    } finally {
      resetOfflinePrefetch();
      queryClient.clear();
    }
  }

  async function logout() {
    const currentToken = tokenRef.current;
    if (currentToken) {
      try {
        await logoutRequest(currentToken);
      } catch {
        // sessão pode já ter expirado no servidor; segue com o logout local
      }
    }
    await clearLocalState();
  }

  async function updateUser(patch: Partial<AuthUser>) {
    if (!user) {
      return;
    }
    const nextUser = { ...user, ...patch };
    setUser(nextUser);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
  }

  async function deleteAccount() {
    // Se a exclusão no servidor falhar (ex.: rede), propaga o erro e NÃO
    // limpa o estado local — a conta ainda existe, a sessão deve continuar.
    const currentToken = tokenRef.current;
    if (currentToken) {
      await deleteMe(currentToken);
    }
    await clearLocalState();
  }

  const value = {
    user,
    token,
    isLoading,
    isRestoring,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUser,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
