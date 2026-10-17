import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { getTrip } from '@/services/trips';

export function tripQueryKey(id: string) {
  return ['trips', id] as const;
}

export function useTripQuery(id: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: tripQueryKey(id),
    queryFn: () => getTrip(token as string, id),
    enabled: !!token && !!id,
  });
}
