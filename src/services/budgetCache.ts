import { getCachedActivities } from './activitiesCache';
import { BudgetSummary } from './budget';
import { getCachedExpenses } from './expensesCache';
import { getCachedTripById } from './tripsCache';
import { logError } from './logger';
import { buildBudgetSummary } from '@/utils/budget';

export async function getCachedBudgetSummary(tripId: string): Promise<BudgetSummary | null> {
  try {
    const [trip, activities, expenses] = await Promise.all([
      getCachedTripById(tripId),
      getCachedActivities(tripId),
      getCachedExpenses(tripId),
    ]);

    if (!trip) {
      return null;
    }

    return buildBudgetSummary(trip, activities, expenses);
  } catch (error) {
    logError('budgetCache.getCachedBudgetSummary', error);
    return null;
  }
}
