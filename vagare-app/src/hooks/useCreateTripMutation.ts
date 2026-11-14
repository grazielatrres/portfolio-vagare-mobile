import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, generateLocalId } from '@/services/syncQueue';
import { CreateTripPayload, buildTripFromPayload, createTrip } from '@/services/trips';
import { upsertTripToCache } from '@/services/tripsCache';
import { tripsQueryKey } from './useTripsQuery';

export function useCreateTripMutation() {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateTripPayload) => {
      try {
        return await createTrip(token as string, payload);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildTripFromPayload(generateLocalId(), user?.id ?? '', payload);
          await upsertTripToCache(local);
          await enqueueMutation({
            tripId: local.id,
            entityType: 'trip',
            operation: 'create',
            localId: local.id,
            payload,
          });
          showToast({
            title: 'Viagem salva localmente',
            message: 'Será sincronizada quando a conexão voltar.',
          });
          return local;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}
