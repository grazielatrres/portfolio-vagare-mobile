import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { listInfos } from '@/services/infos';

export function infosQueryKey(tripId: string) {
  return ['trips', tripId, 'infos'] as const;
}

export function useInfosQuery(tripId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: infosQueryKey(tripId),
    queryFn: () => listInfos(token as string, tripId),
    enabled: !!token && !!tripId,
  });
}
