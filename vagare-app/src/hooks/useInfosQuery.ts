import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { ApiError, isNetworkFailure } from '@/services/api';
import { listInfos } from '@/services/infos';
import { getCachedInfos, saveInfosToCache } from '@/services/infosCache';

export function infosQueryKey(tripId: string) {
  return ['trips', tripId, 'infos'] as const;
}

export function useInfosQuery(tripId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: infosQueryKey(tripId),
    queryFn: async () => {
      try {
        const infos = await listInfos(token as string, tripId);
        await saveInfosToCache(tripId, infos);
        return { infos, isOffline: false };
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const cached = await getCachedInfos(tripId);
          return { infos: cached, isOffline: isNetworkFailure(err) };
        }
        throw err;
      }
    },
    enabled: !!token && !!tripId,
  });
}
