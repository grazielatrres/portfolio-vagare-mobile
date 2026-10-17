import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('@/contexts/AuthContext', () => require('@/test/mockAuth').authContextMock);

import { LodgingForm } from './LodgingForm';
import { buildInfo, buildTrip, mockJsonResponse } from '@/test/fixtures';

const trip = buildTrip();

function renderForm(props: Partial<React.ComponentProps<typeof LodgingForm>> = {}) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <LodgingForm trip={trip} onCancel={jest.fn()} onSuccess={jest.fn()} {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});

describe('LodgingForm', () => {
  it('cria uma hospedagem com os dados preenchidos', async () => {
    const onSuccess = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse(buildInfo({ type: 'lodging', title: 'Canaves Oia Suites' })),
    );

    await renderForm({ onSuccess });

    await fireEvent.changeText(screen.getByPlaceholderText('Ex: Grand Hotel'), 'Canaves Oia Suites');
    await fireEvent.changeText(
      screen.getByPlaceholderText('Endereço completo'),
      'Oia 847 02, Santorini, Grécia',
    );
    await fireEvent.press(screen.getByText('Adicionar'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/trips/trip-1/infos');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      type: 'lodging',
      title: 'Canaves Oia Suites',
      details: { address: 'Oia 847 02, Santorini, Grécia' },
    });
  });

  it('exibe erro quando o nome do hotel (título) está vazio', async () => {
    const onSuccess = jest.fn();
    await renderForm({ onSuccess });

    await fireEvent.press(screen.getByText('Adicionar'));

    expect(await screen.findByText('Nome do hotel é obrigatório')).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('pré-preenche e salva edição de uma hospedagem existente', async () => {
    const onSuccess = jest.fn();
    const existing = buildInfo({
      id: 'info-77',
      type: 'lodging',
      title: 'Grand Hotel',
      date: null,
      details: { address: 'Rua A, 123', checkIn: '2026-09-01', checkOut: '2026-09-05' },
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse(existing));

    await renderForm({ info: existing, onSuccess });

    expect(screen.getByDisplayValue('Grand Hotel')).toBeTruthy();
    expect(screen.getByDisplayValue('Rua A, 123')).toBeTruthy();

    await fireEvent.press(screen.getByText('Salvar'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/trips/trip-1/infos/info-77');
    expect(options.method).toBe('PUT');
  });
});
