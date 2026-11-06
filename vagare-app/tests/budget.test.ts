import { buildBudgetSummary } from '@/utils/budget';
import { Trip } from '@/services/trips';

const baseTrip: Trip = {
  id: 't1',
  userId: 'u1',
  name: 'Grécia',
  destination: 'Atenas',
  latitude: null,
  longitude: null,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  budget: '1000',
  currency: 'BRL',
  numberOfPeople: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('buildBudgetSummary', () => {
  it('soma gastos manuais e custo estimado das atividades no total', () => {
    const summary = buildBudgetSummary(
      baseTrip,
      [
        {
          id: 'a1',
          tripId: 't1',
          name: 'Passeio',
          date: '2026-01-02',
          time: null,
          location: null,
          period: null,
          category: 'Passeios',
          estimatedCost: '100',
          description: null,
        },
      ],
      [
        { id: 'e1', tripId: 't1', description: 'Jantar', amount: '80', currency: 'BRL', category: 'Alimentação' },
      ],
    );

    expect(summary.activitiesCost.total).toBe(100);
    expect(summary.expenses.total).toBe(80);
    expect(summary.totalSpent).toBe(180);
    expect(summary.remainingBalance).toBe(820);
  });

  it('remainingBalance é null quando a viagem não tem orçamento definido', () => {
    const summary = buildBudgetSummary({ ...baseTrip, budget: null }, [], []);
    expect(summary.budget).toBeNull();
    expect(summary.remainingBalance).toBeNull();
  });

  it('agrupa por categoria usando "Sem categoria" como fallback', () => {
    const summary = buildBudgetSummary(
      baseTrip,
      [],
      [
        { id: 'e1', tripId: 't1', description: 'Táxi', amount: '30', currency: 'BRL', category: null },
        { id: 'e2', tripId: 't1', description: 'Museu', amount: '20', currency: 'BRL', category: '  ' },
      ],
    );

    expect(summary.byCategory).toEqual([{ category: 'Sem categoria', total: 50 }]);
  });

  it('ignora atividades sem estimatedCost no total, mas não nas listas', () => {
    const summary = buildBudgetSummary(
      baseTrip,
      [
        {
          id: 'a1',
          tripId: 't1',
          name: 'Sem custo',
          date: '2026-01-02',
          time: null,
          location: null,
          period: null,
          category: null,
          estimatedCost: null,
          description: null,
        },
      ],
      [],
    );

    expect(summary.activitiesCost.items).toEqual([]);
    expect(summary.activitiesCost.total).toBe(0);
  });
});
