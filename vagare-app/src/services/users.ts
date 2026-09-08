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

export function getMe(token: string) {
  return apiRequest<UserProfile>('/users/me', { token });
}
