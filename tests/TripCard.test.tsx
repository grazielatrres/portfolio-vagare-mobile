import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/contexts/ToastContext';
import { TripCard } from '@/screens/Trips/components/TripCard';
import { buildTrip } from './helpers/fixtures';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);

async function renderCard(activityCount: number) {
  await render(
    <SafeAreaProvider>
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider>
          <TripCard trip={buildTrip()} activityCount={activityCount} />
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('TripCard — resumo de atividades', () => {
  it.each([
    [0, 'Nenhuma atividade planejada ainda'],
    [1, '1 atividade planejada'],
    [4, '4 atividades planejadas'],
  ])('com %i atividade(s) mostra "%s"', async (count, text) => {
    await renderCard(count);
    expect(screen.getByText(text)).toBeTruthy();
  });
});
