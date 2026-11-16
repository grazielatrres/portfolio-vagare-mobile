import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { getTripWeather } from '@/services/weather';

export function weatherQueryKey(tripId: string) {
  return ['trips', tripId, 'weather'] as const;
}

export function useWeatherQuery(tripId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: weatherQueryKey(tripId),
    queryFn: () => getTripWeather(token as string, tripId),
    enabled: !!token && !!tripId,
    retry: false,
  });
}
