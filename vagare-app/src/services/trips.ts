import { CurrencyCode } from '@/utils/currency';
import { apiRequest } from './api';

export interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string | null;
  currency: CurrencyCode;
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
  currency?: CurrencyCode;
  numberOfPeople?: number | null;
}

export function listTrips(token: string) {
  return apiRequest<Trip[]>('/trips', { token });
}

export function createTrip(token: string, payload: CreateTripPayload) {
  return apiRequest<Trip>('/trips', { method: 'POST', token, body: payload });
}

export function deleteTrip(token: string, id: string) {
  return apiRequest<void>(`/trips/${id}`, { method: 'DELETE', token });
}
