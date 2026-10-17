export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Bom dia';
  }

  if (hour < 18) {
    return 'Boa tarde';
  }

  return 'Boa noite';
}

export function formatDateShort(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(dateString));
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
}

export function formatDateFull(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(dateString));
}

export function countTripDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export function dayNumberInTrip(tripStartDate: string, date: string): number {
  const start = new Date(tripStartDate);
  const current = new Date(date);
  const diff = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export function getCountryFromDestination(destination: string): string {
  const parts = destination.split(',');
  return parts[parts.length - 1].trim();
}

export function countDistinctCountries(destinations: string[]): number {
  const countries = destinations.map((destination) =>
    getCountryFromDestination(destination).toLowerCase(),
  );
  return new Set(countries).size;
}
