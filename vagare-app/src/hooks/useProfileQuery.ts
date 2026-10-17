import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { getMe } from '@/services/users';

export const profileQueryKey = ['profile'] as const;

export function useProfileQuery() {
  const { token } = useAuth();

  return useQuery({
    queryKey: profileQueryKey,
    queryFn: () => getMe(token as string),
    enabled: !!token,
  });
}
