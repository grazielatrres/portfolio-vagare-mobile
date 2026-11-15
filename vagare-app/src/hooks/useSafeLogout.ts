import { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { pingServer } from '@/services/api';
import { logError } from '@/services/logger';
import { countPendingMutations, drainPendingMutations } from '@/services/syncQueue';

export function useSafeLogout() {
  const { token, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  async function requestLogout() {
    setIsChecking(true);
    let remaining = 0;
    try {
      if ((await countPendingMutations()) > 0 && (await pingServer())) {
        await drainPendingMutations(token);
      }
      remaining = await countPendingMutations();
    } catch (error) {
      logError('useSafeLogout.requestLogout', error);
    } finally {
      setIsChecking(false);
    }

    if (remaining > 0) {
      setUnsyncedCount(remaining);
      return;
    }
    await logout();
  }

  async function confirmLogout() {
    setUnsyncedCount(0);
    await logout();
  }

  function cancelLogout() {
    setUnsyncedCount(0);
  }

  return { requestLogout, confirmLogout, cancelLogout, isChecking, unsyncedCount };
}
