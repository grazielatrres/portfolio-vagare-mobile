import { ActivityPeriod } from '@/services/activities';

export const PERIOD_LABELS: Record<ActivityPeriod, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function derivePeriodFromTime(time: string): ActivityPeriod | null {
  const match = TIME_PATTERN.exec(time.trim());
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);

  if (hour < 12) {
    return 'manha';
  }
  if (hour < 18) {
    return 'tarde';
  }
  return 'noite';
}
