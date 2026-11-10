import { Activity } from '@/services/activities';
import { BudgetSummary } from '@/services/budget';
import { Expense } from '@/services/expenses';
import { Info } from '@/services/infos';
import { Trip } from '@/services/trips';

export function buildTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    userId: 'user-1',
    name: 'Férias em Santorini',
    destination: 'Santorini, Grécia',
    latitude: null,
    longitude: null,
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    budget: null,
    currency: 'BRL',
    numberOfPeople: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildInfo(overrides: Partial<Info> = {}): Info {
  return {
    id: 'info-1',
    tripId: 'trip-1',
    type: 'flight',
    title: 'Aegean Airlines',
    description: null,
    date: '2026-09-01T00:00:00.000Z',
    details: { origin: 'GRU', destination: 'JTR', time: '06:30', flightNumber: 'A3 1234' },
    ...overrides,
  };
}

export function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'activity-1',
    tripId: 'trip-1',
    name: 'Visita à Acrópole',
    date: '2026-09-02T00:00:00.000Z',
    time: '09:00',
    location: 'Acrópole de Atenas',
    period: 'manha',
    category: 'Passeio guiado',
    estimatedCost: '50',
    description: null,
    ...overrides,
  };
}

export function buildExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-1',
    tripId: 'trip-1',
    description: 'Jantar',
    amount: '120',
    currency: 'BRL',
    category: 'Alimentação',
    ...overrides,
  };
}

export function buildBudgetSummary(overrides: Partial<BudgetSummary> = {}): BudgetSummary {
  return {
    budget: 1000,
    currency: 'BRL',
    activitiesCost: { total: 50, items: [] },
    expenses: { total: 120, items: [] },
    totalSpent: 170,
    remainingBalance: 830,
    byCategory: [],
    ...overrides,
  };
}

export function mockJsonResponse(body: unknown, ok = true) {
  return {
    ok,
    headers: { get: () => 'application/json' },
    json: async () => body,
  };
}
