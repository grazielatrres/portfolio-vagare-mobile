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

export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export function resetPassword(token: string, password: string) {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  });
}
