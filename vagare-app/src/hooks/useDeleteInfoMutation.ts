import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { deleteInfo } from '@/services/infos';
import { removeInfoFromCache } from '@/services/infosCache';
import { queryClient } from '@/services/queryClient';
import { discardLocalEntity, enqueueMutation, isLocalId, resolveSyncedId } from '@/services/syncQueue';
import { infosQueryKey } from './useInfosQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useDeleteInfoMutation(rawTripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (rawId: string) => {
      // Item ou viagem criado offline que já sincronizou: usa o id real.
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
      queryClient.invalidateQueries({ queryKey: infosQueryKey(rawTripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(rawTripId) });
    },
  });
}
