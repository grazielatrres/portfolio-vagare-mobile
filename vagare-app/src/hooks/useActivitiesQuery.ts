import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { listActivities } from '@/services/activities';
import { getCachedActivities, saveActivitiesToCache } from '@/services/activitiesCache';
import { ApiError } from '@/services/api';

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
        return { activities, isOffline: false as const };
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const cached = await getCachedActivities(tripId);
          if (cached.length > 0) {
            return { activities: cached, isOffline: true as const };
          }
          throw new ApiError(0, 'Sem conexão e nenhum roteiro salvo neste dispositivo ainda.');
        }
        throw err;
      }
    },
    enabled: !!token && !!tripId,
  });
}
