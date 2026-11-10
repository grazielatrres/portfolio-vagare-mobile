import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { deleteInfo } from '@/services/infos';
import { removeInfoFromCache } from '@/services/infosCache';
import { queryClient } from '@/services/queryClient';
import { discardLocalEntity, enqueueMutation, isLocalId } from '@/services/syncQueue';
import { infosQueryKey } from './useInfosQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useDeleteInfoMutation(tripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
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
      queryClient.invalidateQueries({ queryKey: infosQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(tripId) });
    },
  });
}
