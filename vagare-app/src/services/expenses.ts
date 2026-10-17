import { apiRequest } from './api';

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: string;
  currency: string;
  category: string | null;
}

export interface CreateExpensePayload {
  description: string;
  amount: number;
  currency?: string;
  category?: string | null;
}

export function listExpenses(token: string, tripId: string) {
  return apiRequest<Expense[]>(`/trips/${tripId}/expenses`, { token });
}

export function createExpense(token: string, tripId: string, payload: CreateExpensePayload) {
  return apiRequest<Expense>(`/trips/${tripId}/expenses`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateExpense(
  token: string,
  tripId: string,
  id: string,
  payload: CreateExpensePayload,
) {
  return apiRequest<Expense>(`/trips/${tripId}/expenses/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function deleteExpense(token: string, tripId: string, id: string) {
  return apiRequest<void>(`/trips/${tripId}/expenses/${id}`, { method: 'DELETE', token });
}
