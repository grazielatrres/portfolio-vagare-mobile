import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('@/contexts/AuthContext', () => require('@/test/mockAuth').authContextMock);

import { FlightCard } from './FlightCard';
import { buildInfo, buildTrip, mockJsonResponse } from '@/test/fixtures';

const trip = buildTrip();

async function renderCard() {
  const queryClient = new QueryClient();
  const info = buildInfo();
  await render(
    <QueryClientProvider client={queryClient}>
      <FlightCard info={info} trip={trip} />
    </QueryClientProvider>,
  );
  return info;
}

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});

describe('FlightCard', () => {
  it('exclui o voo ao confirmar no diálogo', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockJsonResponse(null));
    const info = await renderCard();

    await fireEvent.press(screen.getByTestId('delete-button'));
    await fireEvent.press(screen.getByText('Excluir'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain(`/trips/trip-1/infos/${info.id}`);
    expect(options.method).toBe('DELETE');
  });

  it('abre o formulário de edição ao tocar no ícone de editar', async () => {
    await renderCard();

    await fireEvent.press(screen.getByTestId('edit-button'));

    expect(screen.getByText('Editar voo')).toBeTruthy();
  });
});
