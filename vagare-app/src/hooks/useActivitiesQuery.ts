import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { listActivities } from '@/services/activities';
import { getCachedActivities, saveActivitiesToCache } from '@/services/activitiesCache';
import { ApiError, isNetworkFailure } from '@/services/api';
import { hasPendingMutationsForTrip } from '@/services/syncQueue';

export function activitiesQueryKey(tripId: string) {
  return ['trips', tripId, 'activities'] as const;
}

export function useActivitiesQuery(tripId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: activitiesQueryKey(tripId),
    queryFn: async () => {
      try {
        const activities = await listActivities(token as string, tripId);
        await saveActivitiesToCache(tripId, activities);
        // A resposta do servidor ainda não inclui as alterações da fila offline.
        if (await hasPendingMutationsForTrip(tripId)) {
          return { activities: await getCachedActivities(tripId), isOffline: false };
        }
        return { activities, isOffline: false };
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const cached = await getCachedActivities(tripId);
          return { activities: cached, isOffline: isNetworkFailure(err) };
        }
        throw err;
      }
    },
    enabled: !!token && !!tripId,
  });
}
