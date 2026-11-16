import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { CreateInfoPayload, buildInfoFromPayload, createInfo } from '@/services/infos';
import { upsertInfoToCache } from '@/services/infosCache';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, generateLocalId } from '@/services/syncQueue';
import { OFFLINE_SAVED_TOAST } from '@/utils/offlineToasts';
import { infosQueryKey } from './useInfosQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useCreateInfoMutation(tripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateInfoPayload) => {
      // Também é a Idempotency-Key: o reenvio pela fila não duplica o item.
      const localId = generateLocalId();
      try {
        return await createInfo(token as string, tripId, payload, localId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildInfoFromPayload(localId, tripId, payload);
          await upsertInfoToCache(local);
          await enqueueMutation({
            tripId,
            entityType: 'info',
            operation: 'create',
            localId: local.id,
            payload,
          });
          showToast(OFFLINE_SAVED_TOAST);
          return local;
        }
        throw err;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: infosQueryKey(tripId) });
      void queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(tripId) });
    },
  });
}
