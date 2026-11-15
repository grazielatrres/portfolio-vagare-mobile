import { useSyncExternalStore } from 'react';

import { getIsSyncing, subscribeSyncStatus } from '@/services/syncQueue';

export function useIsSyncing(): boolean {
  return useSyncExternalStore(subscribeSyncStatus, getIsSyncing);
}
