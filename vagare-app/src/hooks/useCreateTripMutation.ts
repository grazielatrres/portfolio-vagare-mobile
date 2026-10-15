import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { CreateTripPayload, createTrip } from '@/services/trips';
import { tripsQueryKey } from './useTripsQuery';

export function useCreateTripMutation() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: CreateTripPayload) => createTrip(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsQueryKey });
    },
  });
}
