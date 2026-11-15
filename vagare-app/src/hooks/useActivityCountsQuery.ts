import { useQuery } from '@tanstack/react-query';

import { getCachedActivityCounts } from '@/services/activitiesCache';

export const activityCountsQueryKey = ['activityCounts'] as const;

// Contagem de atividades por viagem, lida do cache local (o prefetch offline
// mantém as atividades de todas as viagens salvas no aparelho).
export function useActivityCountsQuery() {
  return useQuery({
    queryKey: activityCountsQueryKey,
    queryFn: getCachedActivityCounts,
  });
}
