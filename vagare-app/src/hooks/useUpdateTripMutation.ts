import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, resolveSyncedId } from '@/services/syncQueue';
import { CreateTripPayload, Trip, buildUpdatedTrip, updateTrip } from '@/services/trips';
import { upsertTripToCache } from '@/services/tripsCache';
import { OFFLINE_SAVED_TOAST } from '@/utils/offlineToasts';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';
import { tripQueryKey } from './useTripQuery';
import { tripsQueryKey } from './useTripsQuery';

export function useUpdateTripMutation(trip: Trip) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateTripPayload) => {
      const id = resolveSyncedId(trip.id);
      try {
        const updated = await updateTrip(token as string, id, payload);
        await upsertTripToCache(updated);
        return updated;
      } catch (err) {
        // Sem rede (ou viagem ainda não sincronizada): salva localmente e
        // deixa a fila reenviar quando a conexão voltar.
        if (err instanceof ApiError && err.status === 0) {
          const local = buildUpdatedTrip({ ...trip, id }, payload);
          await upsertTripToCache(local);
          await enqueueMutation({
            tripId: id,
            entityType: 'trip',
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
      queryClient.invalidateQueries({ queryKey: tripsQueryKey });
      queryClient.invalidateQueries({ queryKey: tripQueryKey(trip.id) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(trip.id) });
    },
  });
}
