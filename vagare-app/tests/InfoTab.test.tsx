import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

import { InfoTab } from '@/screens/TripDetail/components/InfoTab';
import { buildInfo, buildTrip, mockJsonResponse } from './helpers/fixtures';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);

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
