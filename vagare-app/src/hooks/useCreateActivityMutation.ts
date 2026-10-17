import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { CreateActivityPayload, createActivity } from '@/services/activities';
import { activitiesQueryKey } from './useActivitiesQuery';
import { budgetQueryKey } from './useBudgetQuery';

export function useCreateActivityMutation(tripId: string) {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: CreateActivityPayload) =>
      createActivity(token as string, tripId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: budgetQueryKey(tripId) });
    },
  });
}
