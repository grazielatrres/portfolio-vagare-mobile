import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { FlightForm } from '@/screens/TripDetail/components/FlightForm';
import { buildInfo, buildTrip, mockJsonResponse } from './helpers/fixtures';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);

const trip = buildTrip();

function renderForm(props: Partial<React.ComponentProps<typeof FlightForm>> = {}) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <FlightForm trip={trip} onCancel={jest.fn()} onSuccess={jest.fn()} {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});

describe('FlightForm', () => {
  it('cria um voo com os dados preenchidos', async () => {
    const onSuccess = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse(buildInfo()));

    await renderForm({ onSuccess });

    await fireEvent.changeText(screen.getByPlaceholderText('Ex: Aegean Airlines'), 'Aegean Airlines');
    await fireEvent.changeText(screen.getByPlaceholderText('Ex: GRU'), 'GRU');
    await fireEvent.changeText(screen.getByPlaceholderText('Ex: JTR via ATH'), 'JTR via ATH');
    await fireEvent.press(screen.getByText('Adicionar'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/trips/trip-1/infos');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      type: 'flight',
      title: 'Aegean Airlines',
      details: { origin: 'GRU', destination: 'JTR via ATH' },
    });
  });

  it('exibe erro quando a companhia aérea (título) está vazia', async () => {
    const onSuccess = jest.fn();
    await renderForm({ onSuccess });

    await fireEvent.press(screen.getByText('Adicionar'));

    expect(await screen.findByText('Companhia aérea é obrigatória')).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('pré-preenche e salva edição de um voo existente', async () => {
    const onSuccess = jest.fn();
    const existing = buildInfo({ id: 'info-42', title: 'LATAM' });
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse(buildInfo({ ...existing, title: 'LATAM (editado)' })),
    );

    await renderForm({ info: existing, onSuccess });

    expect(screen.getByDisplayValue('LATAM')).toBeTruthy();

    await fireEvent.changeText(screen.getByDisplayValue('LATAM'), 'LATAM (editado)');
    await fireEvent.press(screen.getByText('Salvar'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/trips/trip-1/infos/info-42');
    expect(options.method).toBe('PUT');
  });
});
