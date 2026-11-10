import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { CreateInfoPayload, buildInfoFromPayload, createInfo } from '@/services/infos';
import { upsertInfoToCache } from '@/services/infosCache';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, generateLocalId } from '@/services/syncQueue';
import { infosQueryKey } from './useInfosQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useCreateInfoMutation(tripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateInfoPayload) => {
      try {
        return await createInfo(token as string, tripId, payload);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildInfoFromPayload(generateLocalId(), tripId, payload);
          await upsertInfoToCache(local);
          await enqueueMutation({
            tripId,
            entityType: 'info',
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
      queryClient.invalidateQueries({ queryKey: infosQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(tripId) });
    },
  });
}
