import { useQuery } from '@tanstack/react-query';

import { getCachedActivityCounts } from '@/services/activitiesCache';

export const activityCountsQueryKey = ['activityCounts'] as const;

export function useActivityCountsQuery() {
  return useQuery({
    queryKey: activityCountsQueryKey,
    queryFn: getCachedActivityCounts,
  });
}
