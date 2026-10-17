import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { getBudgetSummary } from '@/services/budget';

export function budgetQueryKey(tripId: string) {
  return ['trips', tripId, 'budget'] as const;
}

export function useBudgetQuery(tripId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: budgetQueryKey(tripId),
    queryFn: () => getBudgetSummary(token as string, tripId),
    enabled: !!token && !!tripId,
  });
}
