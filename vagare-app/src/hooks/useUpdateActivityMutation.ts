import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CreateActivityPayload, buildActivityFromPayload, updateActivity } from '@/services/activities';
import { upsertActivityToCache } from '@/services/activitiesCache';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, resolveSyncedId } from '@/services/syncQueue';
import { OFFLINE_SAVED_TOAST } from '@/utils/offlineToasts';
import { activitiesQueryKey } from './useActivitiesQuery';
import { budgetQueryKey } from './useBudgetQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export interface UpdateActivityVariables {
  id: string;
  payload: CreateActivityPayload;
}

export function useUpdateActivityMutation(rawTripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id: rawId, payload }: UpdateActivityVariables) => {
      // Item ou viagem criado offline que já sincronizou: usa o id real.
      const id = resolveSyncedId(rawId);
      const tripId = resolveSyncedId(rawTripId);
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
          showToast(OFFLINE_SAVED_TOAST);
          return local;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey(rawTripId) });
      queryClient.invalidateQueries({ queryKey: budgetQueryKey(rawTripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(rawTripId) });
    },
  });
}
