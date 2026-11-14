import { useSyncExternalStore } from 'react';

import { getIsSyncing, subscribeSyncStatus } from '@/services/syncQueue';

// true enquanto a fila offline está enviando alterações ao servidor.
export function useIsSyncing(): boolean {
  return useSyncExternalStore(subscribeSyncStatus, getIsSyncing);
}
