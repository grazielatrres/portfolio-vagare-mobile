import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { UpdateProfilePayload, updateMe } from '@/services/users';
import { profileQueryKey } from './useProfileQuery';

export function useUpdateProfileMutation() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMe(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
}
