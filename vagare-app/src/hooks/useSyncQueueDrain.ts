import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { onBackOnline } from '@/services/connectivity';
import { drainPendingMutations } from '@/services/syncQueue';

export function useSyncQueueDrain() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      return;
    }

    drainPendingMutations(token);

    return onBackOnline(() => {
      drainPendingMutations(token);
    });
  }, [token]);
}
