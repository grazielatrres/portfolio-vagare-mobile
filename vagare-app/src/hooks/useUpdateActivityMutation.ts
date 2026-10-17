import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { CreateActivityPayload, updateActivity } from '@/services/activities';
import { activitiesQueryKey } from './useActivitiesQuery';
import { budgetQueryKey } from './useBudgetQuery';

export interface UpdateActivityVariables {
  id: string;
  payload: CreateActivityPayload;
}

export function useUpdateActivityMutation(tripId: string) {
  const { token } = useAuth();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateActivityVariables) =>
      updateActivity(token as string, tripId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: budgetQueryKey(tripId) });
    },
  });
}
