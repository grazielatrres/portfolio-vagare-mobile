import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CreateActivityPayload, buildActivityFromPayload, updateActivity } from '@/services/activities';
import { upsertActivityToCache } from '@/services/activitiesCache';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation } from '@/services/syncQueue';
import { activitiesQueryKey } from './useActivitiesQuery';
import { budgetQueryKey } from './useBudgetQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export interface UpdateActivityVariables {
  id: string;
  payload: CreateActivityPayload;
}

export function useUpdateActivityMutation(tripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: UpdateActivityVariables) => {
      try {
        return await updateActivity(token as string, tripId, id, payload);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildActivityFromPayload(id, tripId, payload);
          await upsertActivityToCache(local);
          await enqueueMutation({
            tripId,
            entityType: 'activity',
            operation: 'update',
            localId: id,
            payload,
          });
          showToast({
            title: 'Salvo localmente',
            message: 'Será sincronizado quando a conexão voltar.',
          });
          return local;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: budgetQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(tripId) });
    },
  });
}
