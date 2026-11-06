import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import {
  AuthUser,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '@/services/auth';
import { logError } from '@/services/logger';
import { queryClient } from '@/services/queryClient';
import { clearTripsCache } from '@/services/tripsCache';
import { deleteMe } from '@/services/users';

const TOKEN_KEY = 'vagare.auth.token';
const USER_KEY = 'vagare.auth.user';

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

  useEffect(() => {
    async function restoreSession() {
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      setIsRestoring(false);
    }

    restoreSession();
  }, []);

  async function persistSession(nextToken: string, nextUser: AuthUser) {
    setToken(nextToken);
    setUser(nextUser);
    await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
  }

  async function clearSession() {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const response = await loginRequest(email, password);
      await persistSession(response.token, response.user);
    } finally {
      setIsLoading(false);
    }
  }

  async function register(name: string, email: string, password: string) {
    setIsLoading(true);
    try {
      const response = await registerRequest(name, email, password);
      await persistSession(response.token, response.user);
    } finally {
      setIsLoading(false);
    }
  }

  async function loginWithGoogle(idToken: string) {
    setIsLoading(true);
    try {
      const response = await googleLoginRequest(idToken);
      await persistSession(response.token, response.user);
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
    } finally {
      queryClient.clear();
    }
  }

  async function logout() {
    if (token) {
      try {
        await logoutRequest(token);
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
    if (token) {
      await deleteMe(token);
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
