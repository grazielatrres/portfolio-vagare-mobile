import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { deleteInfo } from '@/services/infos';
import { infosQueryKey } from './useInfosQuery';

export function useDeleteInfoMutation(tripId: string) {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (id: string) => deleteInfo(token as string, tripId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infosQueryKey(tripId) });
    },
  });
}
