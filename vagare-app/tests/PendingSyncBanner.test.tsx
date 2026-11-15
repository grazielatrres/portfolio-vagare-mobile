import { render, screen } from '@testing-library/react-native';

import { PendingSyncBanner } from '@/components';
import { useIsSyncing } from '@/hooks/useIsSyncing';

jest.mock('@/hooks/useIsSyncing', () => ({ useIsSyncing: jest.fn() }));

const useIsSyncingMock = useIsSyncing as jest.Mock;

describe('PendingSyncBanner', () => {
  it('não renderiza nada sem pendências', async () => {
    useIsSyncingMock.mockReturnValue(false);
    await render(<PendingSyncBanner count={0} />);
    expect(screen.queryByText(/sincroniza/i)).toBeNull();
  });

  it('mostra quantas alterações aguardam sincronização', async () => {
    useIsSyncingMock.mockReturnValue(false);
    await render(<PendingSyncBanner count={3} />);
    expect(screen.getByText('3 alteração(ões) aguardando sincronização')).toBeTruthy();
  });

  it('troca para "sincronizando" enquanto a fila está sendo enviada', async () => {
    useIsSyncingMock.mockReturnValue(true);
    await render(<PendingSyncBanner count={2} />);
    expect(screen.getByText('Sincronizando 2 alteração(ões)…')).toBeTruthy();
  });
});
