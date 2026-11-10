import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CreateActivityPayload, buildActivityFromPayload, createActivity } from '@/services/activities';
import { upsertActivityToCache } from '@/services/activitiesCache';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, generateLocalId } from '@/services/syncQueue';
import { activitiesQueryKey } from './useActivitiesQuery';
import { budgetQueryKey } from './useBudgetQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useCreateActivityMutation(tripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateActivityPayload) => {
      try {
        return await createActivity(token as string, tripId, payload);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildActivityFromPayload(generateLocalId(), tripId, payload);
          await upsertActivityToCache(local);
          await enqueueMutation({
            tripId,
            entityType: 'activity',
            operation: 'create',
            localId: local.id,
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
