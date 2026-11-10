import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { CreateInfoPayload, buildInfoFromPayload, updateInfo } from '@/services/infos';
import { upsertInfoToCache } from '@/services/infosCache';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation } from '@/services/syncQueue';
import { infosQueryKey } from './useInfosQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export interface UpdateInfoVariables {
  id: string;
  payload: CreateInfoPayload;
}

export function useUpdateInfoMutation(tripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: UpdateInfoVariables) => {
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
