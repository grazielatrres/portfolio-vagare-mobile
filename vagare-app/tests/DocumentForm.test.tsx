import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('@/contexts/AuthContext', () => require('@/test/mockAuth').authContextMock);

import { DocumentForm } from './DocumentForm';
import { buildInfo, buildTrip, mockJsonResponse } from '@/test/fixtures';

const trip = buildTrip();

function renderForm(props: Partial<React.ComponentProps<typeof DocumentForm>> = {}) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentForm trip={trip} onCancel={jest.fn()} onSuccess={jest.fn()} {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});

describe('DocumentForm', () => {
  it('cria um documento com os dados preenchidos', async () => {
    const onSuccess = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue(
      mockJsonResponse(buildInfo({ type: 'document', title: 'Passaporte' })),
    );

    await renderForm({ onSuccess });

    await fireEvent.changeText(
      screen.getByPlaceholderText('Ex: Passaporte, Visto, Seguro viagem'),
      'Passaporte',
    );
    await fireEvent.changeText(screen.getByPlaceholderText('Ex: FZ123456'), 'FZ123456');
    await fireEvent.press(screen.getByText('Adicionar'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/trips/trip-1/infos');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      type: 'document',
      title: 'Passaporte',
      details: { number: 'FZ123456' },
    });
  });

  it('exibe erro quando o tipo de documento (título) está vazio', async () => {
    const onSuccess = jest.fn();
    await renderForm({ onSuccess });

    await fireEvent.press(screen.getByText('Adicionar'));

    expect(await screen.findByText('Tipo de documento é obrigatório')).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('pré-preenche e salva edição de um documento existente', async () => {
    const onSuccess = jest.fn();
    const existing = buildInfo({
      id: 'info-9',
      type: 'document',
      title: 'Visto',
      date: '2030-01-01T00:00:00.000Z',
      description: 'Observações antigas',
      details: { number: 'V-001' },
    });
    (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse(existing));

    await renderForm({ info: existing, onSuccess });

    expect(screen.getByDisplayValue('Visto')).toBeTruthy();
    expect(screen.getByDisplayValue('V-001')).toBeTruthy();
    expect(screen.getByDisplayValue('Observações antigas')).toBeTruthy();

    await fireEvent.press(screen.getByText('Salvar'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/trips/trip-1/infos/info-9');
    expect(options.method).toBe('PUT');
  });
});
