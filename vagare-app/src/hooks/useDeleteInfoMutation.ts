import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { deleteInfo } from '@/services/infos';
import { removeInfoFromCache } from '@/services/infosCache';
import { queryClient } from '@/services/queryClient';
import { discardLocalEntity, enqueueMutation, isLocalId, resolveSyncedId } from '@/services/syncQueue';
import { OFFLINE_DELETED_TOAST } from '@/utils/offlineToasts';
import { infosQueryKey } from './useInfosQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useDeleteInfoMutation(rawTripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (rawId: string) => {
      const id = resolveSyncedId(rawId);
      const tripId = resolveSyncedId(rawTripId);
      try {
        await deleteInfo(token as string, tripId, id);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          if (isLocalId(id)) {
            await discardLocalEntity('info', id);
          } else {
            await removeInfoFromCache(id);
            await enqueueMutation({
              tripId,
              entityType: 'info',
              operation: 'delete',
              localId: id,
              payload: null,
            });
          }
          showToast(OFFLINE_DELETED_TOAST);
          return;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infosQueryKey(rawTripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(rawTripId) });
    },
  });
}
