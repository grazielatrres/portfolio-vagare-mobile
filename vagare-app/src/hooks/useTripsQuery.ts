import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
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
