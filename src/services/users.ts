import { apiRequest } from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  provider: 'local' | 'google';
  createdAt: string;
  stats: {
    totalTrips: number;
  };
}

export interface UpdateProfilePayload {
  name: string;
}

export function getMe(token: string) {
  return apiRequest<UserProfile>('/users/me', { token });
}

export function updateMe(token: string, payload: UpdateProfilePayload) {
  return apiRequest<UserProfile>('/users/me', { method: 'PUT', token, body: payload });
}

export function deleteMe(token: string) {
  return apiRequest<void>('/users/me', { method: 'DELETE', token });
}
