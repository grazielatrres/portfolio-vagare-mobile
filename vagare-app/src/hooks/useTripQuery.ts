import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
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
      try {
        const trip = await getTrip(token as string, id);
        return { trip, isOffline: false as const };
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const cached = await getCachedTripById(id);
          if (cached) {
            return { trip: cached, isOffline: true as const };
          }
          throw new ApiError(0, 'Sem conexão e esta viagem ainda não foi salva neste dispositivo.');
        }
        throw err;
      }
    },
    enabled: !!token && !!id,
  });
}
