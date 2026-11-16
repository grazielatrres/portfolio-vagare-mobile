import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, generateLocalId } from '@/services/syncQueue';
import { CreateTripPayload, buildTripFromPayload, createTrip } from '@/services/trips';
import { upsertTripToCache } from '@/services/tripsCache';
import { OFFLINE_SAVED_TOAST } from '@/utils/offlineToasts';
import { tripsQueryKey } from './useTripsQuery';

export function useCreateTripMutation() {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateTripPayload) => {
      // Também é a Idempotency-Key: o reenvio pela fila não duplica o item.
      const localId = generateLocalId();
      try {
        return await createTrip(token as string, payload, localId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildTripFromPayload(localId, user?.id ?? '', payload);
          await upsertTripToCache(local);
          await enqueueMutation({
            tripId: local.id,
            entityType: 'trip',
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
      void queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}
