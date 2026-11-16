import { Activity } from '@/services/activities';
import { ActivityCostItem, BudgetSummary, CategoryBreakdownItem } from '@/services/budget';
import { Expense } from '@/services/expenses';
import { Trip } from '@/services/trips';

const UNCATEGORIZED_LABEL = 'Sem categoria';

// Replica a matemática de portfolio-vagare-backend/src/services/budget.service.ts
// para reconstruir o resumo de orçamento offline a partir do cache local.
export function buildBudgetSummary(trip: Trip, activities: Activity[], expenses: Expense[]): BudgetSummary {
  const activityItems: ActivityCostItem[] = activities
    .filter((activity) => activity.estimatedCost !== null)
    .map((activity) => ({
      id: activity.id,
      name: activity.name,
      category: activity.category,
      estimatedCost: Number(activity.estimatedCost),
    }));

  const expensesTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const activitiesTotal = activityItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalSpent = expensesTotal + activitiesTotal;

  const budget = trip.budget !== null ? Number(trip.budget) : null;
  const remainingBalance = budget !== null ? budget - totalSpent : null;

  return {
    budget,
    currency: trip.currency,
    activitiesCost: { total: activitiesTotal, items: activityItems },
    expenses: { total: expensesTotal, items: expenses },
    totalSpent,
    remainingBalance,
    byCategory: buildCategoryBreakdown(expenses, activityItems),
  };
}

function buildCategoryBreakdown(
  expenses: Expense[],
  activityItems: ActivityCostItem[],
): CategoryBreakdownItem[] {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    const key = expense.category?.trim() || UNCATEGORIZED_LABEL;
    totals.set(key, (totals.get(key) ?? 0) + Number(expense.amount));
  }

  for (const item of activityItems) {
    const key = item.category?.trim() || UNCATEGORIZED_LABEL;
    totals.set(key, (totals.get(key) ?? 0) + item.estimatedCost);
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}
