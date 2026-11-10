import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { deleteActivity } from '@/services/activities';
import { removeActivityFromCache } from '@/services/activitiesCache';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { discardLocalEntity, enqueueMutation, isLocalId } from '@/services/syncQueue';
import { activitiesQueryKey } from './useActivitiesQuery';
import { budgetQueryKey } from './useBudgetQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useDeleteActivityMutation(tripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
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
      queryClient.invalidateQueries({ queryKey: activitiesQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: budgetQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(tripId) });
    },
  });
}
