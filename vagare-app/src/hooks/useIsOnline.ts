import { useSyncExternalStore } from 'react';

import { getIsOnline, subscribeConnectivity } from '@/services/connectivity';

export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribeConnectivity, getIsOnline);
}
