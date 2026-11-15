import { useSyncExternalStore } from 'react';

import { getIsOnline, subscribeConnectivity } from '@/services/connectivity';

// false desde a última requisição que não chegou ao servidor até a próxima que chegar.
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribeConnectivity, getIsOnline);
}
