import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { deleteActivity } from '@/services/activities';
import { activitiesQueryKey } from './useActivitiesQuery';
import { budgetQueryKey } from './useBudgetQuery';

export function useDeleteActivityMutation(tripId: string) {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (id: string) => deleteActivity(token as string, tripId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: budgetQueryKey(tripId) });
    },
  });
}
