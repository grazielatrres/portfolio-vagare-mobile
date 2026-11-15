import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { deleteActivity } from '@/services/activities';
import { removeActivityFromCache } from '@/services/activitiesCache';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { discardLocalEntity, enqueueMutation, isLocalId, resolveSyncedId } from '@/services/syncQueue';
import { activitiesQueryKey } from './useActivitiesQuery';
import { budgetQueryKey } from './useBudgetQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useDeleteActivityMutation(rawTripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (rawId: string) => {
      // Item ou viagem criado offline que já sincronizou: usa o id real.
      const id = resolveSyncedId(rawId);
      const tripId = resolveSyncedId(rawTripId);
      try {
        await deleteActivity(token as string, tripId, id);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          if (isLocalId(id)) {
            // Nunca existiu no servidor — não há nada a sincronizar.
            await discardLocalEntity('activity', id);
          } else {
            await removeActivityFromCache(id);
            await enqueueMutation({
              tripId,
              entityType: 'activity',
              operation: 'delete',
              localId: id,
              payload: null,
            });
          }
          showToast({
            title: 'Excluído localmente',
            message: 'Será sincronizado quando a conexão voltar.',
          });
          return;
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
