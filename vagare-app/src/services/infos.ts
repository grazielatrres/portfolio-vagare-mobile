import { apiRequest } from './api';

export type InfoType = 'flight' | 'lodging' | 'document';

export interface FlightDetails {
  origin: string;
  destination: string;
  time: string;
  flightNumber: string;
}

export interface LodgingDetails {
  address: string;
  checkIn: string;
  checkOut: string;
}

export interface DocumentDetails {
  number: string;
}

export interface Info {
  id: string;
  tripId: string;
  type: InfoType;
  title: string;
  description: string | null;
  date: string | null;
  details: Record<string, string> | null;
}

export interface CreateInfoPayload {
  type: InfoType;
  title: string;
  description?: string | null;
  date?: string | null;
  details?: Record<string, string> | null;
}

export function listInfos(token: string, tripId: string) {
  return apiRequest<Info[]>(`/trips/${tripId}/infos`, { token });
}

export function createInfo(token: string, tripId: string, payload: CreateInfoPayload) {
  return apiRequest<Info>(`/trips/${tripId}/infos`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateInfo(
  token: string,
  tripId: string,
  id: string,
  payload: CreateInfoPayload,
) {
  return apiRequest<Info>(`/trips/${tripId}/infos/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function deleteInfo(token: string, tripId: string, id: string) {
  return apiRequest<void>(`/trips/${tripId}/infos/${id}`, { method: 'DELETE', token });
}
