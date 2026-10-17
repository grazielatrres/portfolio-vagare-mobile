import { apiRequest } from './api';

export type ActivityPeriod = 'manha' | 'tarde' | 'noite';

export interface Activity {
  id: string;
  tripId: string;
  name: string;
  date: string;
  time: string | null;
  location: string | null;
  period: ActivityPeriod | null;
  category: string | null;
  estimatedCost: string | null;
  description: string | null;
}

export interface CreateActivityPayload {
  name: string;
  date: string;
  time?: string | null;
  location?: string | null;
  period?: ActivityPeriod | null;
  category?: string | null;
  estimatedCost?: number | null;
  description?: string | null;
}

export function listActivities(token: string, tripId: string) {
  return apiRequest<Activity[]>(`/trips/${tripId}/activities`, { token });
}

export function createActivity(token: string, tripId: string, payload: CreateActivityPayload) {
  return apiRequest<Activity>(`/trips/${tripId}/activities`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateActivity(
  token: string,
  tripId: string,
  id: string,
  payload: CreateActivityPayload,
) {
  return apiRequest<Activity>(`/trips/${tripId}/activities/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function deleteActivity(token: string, tripId: string, id: string) {
  return apiRequest<void>(`/trips/${tripId}/activities/${id}`, { method: 'DELETE', token });
}
