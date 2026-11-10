import { getCachedActivities } from '@/services/activitiesCache';
import { getCachedBudgetSummary } from '@/services/budgetCache';
import { getCachedExpenses } from '@/services/expensesCache';
import { getCachedTripById } from '@/services/tripsCache';

jest.mock('@/services/activitiesCache', () => ({ getCachedActivities: jest.fn() }));
jest.mock('@/services/expensesCache', () => ({ getCachedExpenses: jest.fn() }));
jest.mock('@/services/tripsCache', () => ({ getCachedTripById: jest.fn() }));

const trip = {
  id: 't1',
  userId: 'u1',
  name: 'Grécia',
  destination: 'Atenas',
  latitude: null,
  longitude: null,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  budget: '1000',
  currency: 'BRL' as const,
  numberOfPeople: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('budgetCache.getCachedBudgetSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna null quando a trip não está no cache', async () => {
    (getCachedTripById as jest.Mock).mockResolvedValue(null);
    (getCachedActivities as jest.Mock).mockResolvedValue([]);
    (getCachedExpenses as jest.Mock).mockResolvedValue([]);

    await expect(getCachedBudgetSummary('t1')).resolves.toBeNull();
  });

  it('compõe o resumo a partir de trip + atividades + gastos cacheados', async () => {
    (getCachedTripById as jest.Mock).mockResolvedValue(trip);
    (getCachedActivities as jest.Mock).mockResolvedValue([
      {
        id: 'a1',
        tripId: 't1',
        name: 'Passeio',
        date: '2026-01-02',
        time: null,
        location: null,
        period: null,
        category: null,
        estimatedCost: '100',
        description: null,
      },
    ]);
    (getCachedExpenses as jest.Mock).mockResolvedValue([
      { id: 'e1', tripId: 't1', description: 'Jantar', amount: '50', currency: 'BRL', category: null },
    ]);

    const summary = await getCachedBudgetSummary('t1');

    expect(summary?.totalSpent).toBe(150);
    expect(summary?.remainingBalance).toBe(850);
  });

  it('retorna null em falha de qualquer fonte do cache', async () => {
    (getCachedTripById as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));

    await expect(getCachedBudgetSummary('t1')).resolves.toBeNull();
  });
});
