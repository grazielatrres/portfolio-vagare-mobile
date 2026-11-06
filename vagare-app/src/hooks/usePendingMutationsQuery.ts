import { useQuery } from '@tanstack/react-query';

import { getPendingMutations } from '@/services/syncQueue';

export function pendingMutationsQueryKey(tripId: string) {
  return ['trips', tripId, 'pendingMutations'] as const;
}

export function usePendingMutationsQuery(tripId: string) {
  return useQuery({
    queryKey: pendingMutationsQueryKey(tripId),
    queryFn: () => getPendingMutations(tripId),
    enabled: !!tripId,
  });
}
