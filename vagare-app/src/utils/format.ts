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
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(
    new Date(dateString),
  );
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
}

export function formatCurrency(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value),
  );
}
