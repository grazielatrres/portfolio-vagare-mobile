export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
