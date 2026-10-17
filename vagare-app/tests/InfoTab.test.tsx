import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

jest.mock('@/contexts/AuthContext', () => require('@/test/mockAuth').authContextMock);

import { InfoTab } from './InfoTab';
import { buildInfo, buildTrip, mockJsonResponse } from '@/test/fixtures';

const trip = buildTrip();

async function renderTab() {
  const queryClient = new QueryClient();
  await render(
    <QueryClientProvider client={queryClient}>
      <InfoTab trip={trip} />
    </QueryClientProvider>,
  );
}

describe('InfoTab', () => {
  it('mostra o estado vazio em cada seção quando não há informações', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockJsonResponse([])) as unknown as typeof fetch;

    await renderTab();

    expect(await screen.findByText('Nenhum voo cadastrado ainda.')).toBeTruthy();
    expect(screen.getByText('Nenhuma hospedagem cadastrada ainda.')).toBeTruthy();
    expect(screen.getByText('Nenhum documento cadastrado ainda.')).toBeTruthy();
  });

  it('agrupa as informações existentes na seção correta e some com o estado vazio dela', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      mockJsonResponse([
        buildInfo({ id: 'info-1', type: 'flight', title: 'Aegean Airlines' }),
        buildInfo({ id: 'info-2', type: 'lodging', title: 'Canaves Oia Suites', details: {} }),
      ]),
    ) as unknown as typeof fetch;

    await renderTab();

    expect(await screen.findByText('Aegean Airlines')).toBeTruthy();
    expect(screen.getByText('Canaves Oia Suites')).toBeTruthy();
    expect(screen.queryByText('Nenhum voo cadastrado ainda.')).toBeNull();
    expect(screen.queryByText('Nenhuma hospedagem cadastrada ainda.')).toBeNull();
    expect(screen.getByText('Nenhum documento cadastrado ainda.')).toBeTruthy();
  });
});
