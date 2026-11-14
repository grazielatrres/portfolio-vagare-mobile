import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { ApiError, isNetworkFailure } from '@/services/api';
import { getBudgetSummary } from '@/services/budget';
import { getCachedBudgetSummary } from '@/services/budgetCache';
import { saveExpensesToCache } from '@/services/expensesCache';

export function budgetQueryKey(tripId: string) {
  return ['trips', tripId, 'budget'] as const;
}

export function useBudgetQuery(tripId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: budgetQueryKey(tripId),
    queryFn: async () => {
      try {
        const summary = await getBudgetSummary(token as string, tripId);
        await saveExpensesToCache(tripId, summary.expenses.items);
        return { summary, isOffline: false };
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const cached = await getCachedBudgetSummary(tripId);
          if (cached) {
            return { summary: cached, isOffline: isNetworkFailure(err) };
          }
          throw new ApiError(0, 'Sem conexão e nenhum orçamento salvo neste dispositivo ainda.');
        }
        throw err;
      }
    },
    enabled: !!token && !!tripId,
  });
}
