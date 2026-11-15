import { StyleProp, ViewStyle } from 'react-native';

import { useIsSyncing } from '@/hooks/useIsSyncing';
import { OfflineBanner } from './OfflineBanner';

export interface SyncStatusBannerProps {
  isOffline: boolean;
  pendingCount: number;
  offlineMessage: string;
  style?: StyleProp<ViewStyle>;
}

export function SyncStatusBanner({
  isOffline,
  pendingCount,
  offlineMessage,
  style,
}: SyncStatusBannerProps) {
  const isSyncing = useIsSyncing();
  const pendingText = `${pendingCount} alteração(ões) aguardando sincronização`;

  if (isOffline) {
    return (
      <OfflineBanner
        message={pendingCount > 0 ? `Sem conexão — ${pendingText}` : offlineMessage}
        style={style}
      />
    );
  }

  if (pendingCount === 0) {
    return null;
  }

  return isSyncing ? (
    <OfflineBanner
      tone="syncing"
      message={`Sincronizando ${pendingCount} alteração(ões)…`}
      style={style}
    />
  ) : (
    <OfflineBanner tone="pending" message={pendingText} style={style} />
  );
}
