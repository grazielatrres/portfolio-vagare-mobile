import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import {
  AuthUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '@/services/auth';
import { queryClient } from '@/services/queryClient';
import { clearTripsCache } from '@/services/tripsCache';

const TOKEN_KEY = 'vagare.auth.token';
const USER_KEY = 'vagare.auth.user';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  async function logout() {
    if (token) {
      try {
        await logoutRequest(token);
      } catch {
        // sessão pode já ter expirado no servidor; segue com o logout local
      }
    }
    await clearSession();
    await clearTripsCache();
    queryClient.clear();
  }

  const value = { user, token, isLoading, isRestoring, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
