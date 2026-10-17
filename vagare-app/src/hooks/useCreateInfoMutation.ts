import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { CreateInfoPayload, createInfo } from '@/services/infos';
import { infosQueryKey } from './useInfosQuery';

export function useCreateInfoMutation(tripId: string) {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: CreateInfoPayload) => createInfo(token as string, tripId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infosQueryKey(tripId) });
    },
  });
}
