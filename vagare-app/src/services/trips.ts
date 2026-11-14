import { CurrencyCode } from '@/utils/currency';
import { apiRequest } from './api';

export interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  latitude: string | null;
  longitude: string | null;
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
  latitude?: number | null;
  longitude?: number | null;
  startDate: string;
  endDate: string;
  budget?: number | null;
  currency?: CurrencyCode;
  numberOfPeople?: number | null;
}

export function listTrips(token: string) {
  return apiRequest<Trip[]>('/trips', { token });
}

export function getTrip(token: string, id: string) {
  return apiRequest<Trip>(`/trips/${id}`, { token });
}

export function createTrip(token: string, payload: CreateTripPayload) {
  return apiRequest<Trip>('/trips', { method: 'POST', token, body: payload });
}

export function deleteTrip(token: string, id: string) {
  return apiRequest<void>(`/trips/${id}`, { method: 'DELETE', token });
}

// Monta a viagem local a partir do payload do formulário, usada quando a
// criação acontece offline e ainda não existe resposta real do servidor.
export function buildTripFromPayload(id: string, userId: string, payload: CreateTripPayload): Trip {
  const now = new Date().toISOString();
  return {
    id,
    userId,
    name: payload.name,
    destination: payload.destination,
    latitude: payload.latitude != null ? String(payload.latitude) : null,
    longitude: payload.longitude != null ? String(payload.longitude) : null,
    startDate: payload.startDate,
    endDate: payload.endDate,
    budget: payload.budget != null ? String(payload.budget) : null,
    currency: payload.currency ?? 'BRL',
    numberOfPeople: payload.numberOfPeople ?? null,
    createdAt: now,
    updatedAt: now,
  };
}
