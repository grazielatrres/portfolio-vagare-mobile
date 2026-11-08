import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { onBackOnline } from '@/services/connectivity';
import { logError } from '@/services/logger';
import { drainPendingMutations } from '@/services/syncQueue';

export function useSyncQueueDrain() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      return;
    }

    function safeDrain() {
      drainPendingMutations(token).catch((error) => logError('useSyncQueueDrain', error));
    }

    safeDrain();

    return onBackOnline(() => {
      safeDrain();
    });
  }, [token]);
}
