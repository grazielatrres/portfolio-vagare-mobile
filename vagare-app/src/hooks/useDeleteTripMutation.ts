import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { deleteTrip } from '@/services/trips';
import { tripsQueryKey } from './useTripsQuery';

export function useDeleteTripMutation() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (id: string) => deleteTrip(token as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}
