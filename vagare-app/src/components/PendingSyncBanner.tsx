import { StyleProp, ViewStyle } from 'react-native';

import { useIsSyncing } from '@/hooks/useIsSyncing';
import { OfflineBanner } from './OfflineBanner';

export interface PendingSyncBannerProps {
  count: number;
  style?: StyleProp<ViewStyle>;
}

export function PendingSyncBanner({ count, style }: PendingSyncBannerProps) {
  const isSyncing = useIsSyncing();

  if (count === 0) {
    return null;
  }

  return isSyncing ? (
    <OfflineBanner tone="syncing" message={`Sincronizando ${count} alteração(ões)…`} style={style} />
  ) : (
    <OfflineBanner
      tone="pending"
      message={`${count} alteração(ões) aguardando sincronização`}
      style={style}
    />
  );
}
