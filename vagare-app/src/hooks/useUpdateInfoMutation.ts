import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { CreateInfoPayload, updateInfo } from '@/services/infos';
import { infosQueryKey } from './useInfosQuery';

export interface UpdateInfoVariables {
  id: string;
  payload: CreateInfoPayload;
}

export function useUpdateInfoMutation(tripId: string) {
  const { token } = useAuth();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateInfoVariables) =>
      updateInfo(token as string, tripId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: infosQueryKey(tripId) });
    },
  });
}
