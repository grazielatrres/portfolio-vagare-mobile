import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { discardLocalEntity, isLocalId, queueTripDeletion } from '@/services/syncQueue';
import { deleteTrip } from '@/services/trips';
import { OFFLINE_DELETED_TOAST } from '@/utils/offlineToasts';
import { tripsQueryKey } from './useTripsQuery';

export function useDeleteTripMutation() {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isLocalId(id)) {
        // Criada offline e nunca enviada — basta descartar localmente.
        await discardLocalEntity('trip', id);
        return;
      }

      try {
        await deleteTrip(token as string, id);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          await queueTripDeletion(id);
          showToast(OFFLINE_DELETED_TOAST);
          return;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}
