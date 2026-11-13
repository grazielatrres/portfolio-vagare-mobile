import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
import { logError } from '@/services/logger';
import { prefetchTripsForOffline } from '@/services/offlinePrefetch';
import { listTrips } from '@/services/trips';
import { getCachedTrips, saveTripsToCache } from '@/services/tripsCache';

export const tripsQueryKey = ['trips'] as const;

export function useTripsQuery() {
  const { token } = useAuth();

  return useQuery({
    queryKey: tripsQueryKey,
    queryFn: async () => {
      try {
        const trips = await listTrips(token as string);
        await saveTripsToCache(trips);
        // Em segundo plano: a lista aparece já, os detalhes vão para o cache.
        prefetchTripsForOffline(token as string, trips).catch((error) =>
          logError('useTripsQuery.prefetch', error),
        );
        return { trips, isOffline: false as const };
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const cached = await getCachedTrips();
          if (cached.length > 0) {
            return { trips: cached, isOffline: true as const };
          }
          throw new ApiError(0, 'Sem conexão e nenhuma viagem salva neste dispositivo ainda.');
        }
        throw err;
      }
    },
    enabled: !!token,
  });
}
