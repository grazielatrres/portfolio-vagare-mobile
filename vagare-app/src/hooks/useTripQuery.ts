import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { ApiError, isNetworkFailure } from '@/services/api';
import { resolveSyncedId } from '@/services/syncQueue';
import { getTrip } from '@/services/trips';
import { getCachedTripById } from '@/services/tripsCache';

export function tripQueryKey(id: string) {
  return ['trips', id] as const;
}

export function useTripQuery(id: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: tripQueryKey(id),
    queryFn: async () => {
      // Tela aberta com o id local de uma viagem que já sincronizou: segue o
      // id real (as abas usam trip.id, então passam a usar o id do servidor).
      const resolvedId = resolveSyncedId(id);

      try {
        const trip = await getTrip(token as string, resolvedId);
        return { trip, isOffline: false };
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const cached = await getCachedTripById(resolvedId);
          if (cached) {
            return { trip: cached, isOffline: isNetworkFailure(err) };
          }
          throw new ApiError(0, 'Sem conexão e esta viagem ainda não foi salva neste dispositivo.');
        }
        throw err;
      }
    },
    enabled: !!token && !!id,
  });
}
