import { apiRequest } from './api';

export interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string | null;
  numberOfPeople: number | null;
  createdAt: string;
  updatedAt: string;
}

export function listTrips(token: string) {
  return apiRequest<Trip[]>('/trips', { token });
}
