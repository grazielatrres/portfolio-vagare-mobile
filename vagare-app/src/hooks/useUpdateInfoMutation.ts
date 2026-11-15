import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { CreateInfoPayload, buildInfoFromPayload, updateInfo } from '@/services/infos';
import { upsertInfoToCache } from '@/services/infosCache';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, resolveSyncedId } from '@/services/syncQueue';
import { OFFLINE_SAVED_TOAST } from '@/utils/offlineToasts';
import { infosQueryKey } from './useInfosQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export interface UpdateInfoVariables {
  id: string;
  payload: CreateInfoPayload;
}

export function useUpdateInfoMutation(rawTripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id: rawId, payload }: UpdateInfoVariables) => {
      // Item ou viagem criado offline que já sincronizou: usa o id real.
      const id = resolveSyncedId(rawId);
      const tripId = resolveSyncedId(rawTripId);
      try {
        return await updateInfo(token as string, tripId, id, payload);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildInfoFromPayload(id, tripId, payload);
          await upsertInfoToCache(local);
          await enqueueMutation({
            tripId,
            entityType: 'info',
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
      queryClient.invalidateQueries({ queryKey: infosQueryKey(rawTripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(rawTripId) });
    },
  });
}
