import { render, screen } from '@testing-library/react-native';

import { SyncStatusBanner } from '@/components';
import { useIsSyncing } from '@/hooks/useIsSyncing';

jest.mock('@/hooks/useIsSyncing', () => ({ useIsSyncing: jest.fn() }));

const useIsSyncingMock = useIsSyncing as jest.Mock;
const OFFLINE_MESSAGE = 'Sem conexão — mostrando dados salvos neste dispositivo';

async function renderBanner(isOffline: boolean, pendingCount: number) {
  await render(
    <SyncStatusBanner
      isOffline={isOffline}
      pendingCount={pendingCount}
      offlineMessage={OFFLINE_MESSAGE}
    />,
  );
}

describe('SyncStatusBanner', () => {
  beforeEach(() => {
    useIsSyncingMock.mockReturnValue(false);
  });

  it('online e sem pendências, não mostra nada', async () => {
    await renderBanner(false, 0);
    expect(screen.queryByText(/conexão|sincroniza/i)).toBeNull();
  });

  it('offline e sem pendências, mostra só o aviso de offline', async () => {
    await renderBanner(true, 0);
    expect(screen.getByText(OFFLINE_MESSAGE)).toBeTruthy();
  });

  it('offline com pendências, junta os dois num aviso só', async () => {
    await renderBanner(true, 2);
    expect(
      screen.getByText('Sem conexão — 2 alteração(ões) aguardando sincronização'),
    ).toBeTruthy();
    expect(screen.queryByText(OFFLINE_MESSAGE)).toBeNull();
  });

  it('online com pendências, mostra quantas aguardam sincronização', async () => {
    await renderBanner(false, 3);
    expect(screen.getByText('3 alteração(ões) aguardando sincronização')).toBeTruthy();
  });

  it('troca para "sincronizando" enquanto a fila está sendo enviada', async () => {
    useIsSyncingMock.mockReturnValue(true);
    await renderBanner(false, 2);
    expect(screen.getByText('Sincronizando 2 alteração(ões)…')).toBeTruthy();
  });
});
