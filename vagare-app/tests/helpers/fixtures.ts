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

export function mockJsonResponse(body: unknown, ok = true) {
  return {
    ok,
    headers: { get: () => 'application/json' },
    json: async () => body,
  };
}
