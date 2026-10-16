import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { listActivities } from '@/services/activities';

export function activitiesQueryKey(tripId: string) {
  return ['trips', tripId, 'activities'] as const;
}

export function useActivitiesQuery(tripId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: activitiesQueryKey(tripId),
    queryFn: () => listActivities(token as string, tripId),
    enabled: !!token && !!tripId,
  });
}
