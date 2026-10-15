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

export interface CreateTripPayload {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number | null;
  numberOfPeople?: number | null;
}

export function listTrips(token: string) {
  return apiRequest<Trip[]>('/trips', { token });
}

export function createTrip(token: string, payload: CreateTripPayload) {
  return apiRequest<Trip>('/trips', { method: 'POST', token, body: payload });
}
