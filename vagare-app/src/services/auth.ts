import { apiRequest } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: 'local' | 'google';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function register(name: string, email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

export function logout(token: string) {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    token,
  });
}
