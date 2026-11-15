import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
import { logError } from '@/services/logger';
import { prefetchTripsForOffline } from '@/services/offlinePrefetch';
import { queryClient } from '@/services/queryClient';
import { getPendingTripDeletionIds } from '@/services/syncQueue';
import { listTrips } from '@/services/trips';
import { getCachedTrips, getLocalOnlyTrips, saveTripsToCache } from '@/services/tripsCache';
import { activityCountsQueryKey } from './useActivityCountsQuery';

export const tripsQueryKey = ['trips'] as const;

export function useTripsQuery() {
  const { token } = useAuth();

  return useQuery({
    queryKey: tripsQueryKey,
    queryFn: async () => {
      try {
        const [fetchedTrips, pendingDeletionIds] = await Promise.all([
          listTrips(token as string),
          getPendingTripDeletionIds(),
        ]);
        const serverTrips = fetchedTrips.filter((trip) => !pendingDeletionIds.has(trip.id));
        await saveTripsToCache(serverTrips);
        prefetchTripsForOffline(token as string, serverTrips)
          .then(() => queryClient.invalidateQueries({ queryKey: activityCountsQueryKey }))
          .catch((error) => logError('useTripsQuery.prefetch', error));
        const localTrips = await getLocalOnlyTrips();
        const trips = [...serverTrips, ...localTrips].sort((a, b) =>
          a.startDate.localeCompare(b.startDate),
        );
        return { trips, isOffline: false };
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const cached = await getCachedTrips();
          return { trips: cached, isOffline: true };
        }
        throw err;
      }
    },
    enabled: !!token,
  });
}
