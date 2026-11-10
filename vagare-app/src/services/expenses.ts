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

// Monta a entidade local a partir do payload do formulário, usada quando a
// criação/edição acontece offline e ainda não existe (ou não foi atualizada)
// resposta real do servidor.
export function buildExpenseFromPayload(
  id: string,
  tripId: string,
  payload: CreateExpensePayload,
): Expense {
  return {
    id,
    tripId,
    description: payload.description,
    amount: String(payload.amount),
    currency: payload.currency ?? 'BRL',
    category: payload.category ?? null,
  };
}
