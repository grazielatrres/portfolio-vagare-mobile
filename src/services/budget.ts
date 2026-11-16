import { Expense } from './expenses';
import { apiRequest } from './api';

export interface ActivityCostItem {
  id: string;
  name: string;
  category: string | null;
  estimatedCost: number;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
}

export interface BudgetSummary {
  budget: number | null;
  currency: string;
  activitiesCost: { total: number; items: ActivityCostItem[] };
  expenses: { total: number; items: Expense[] };
  totalSpent: number;
  remainingBalance: number | null;
  byCategory: CategoryBreakdownItem[];
}

export function getBudgetSummary(token: string, tripId: string) {
  return apiRequest<BudgetSummary>(`/trips/${tripId}/budget`, { token });
}
