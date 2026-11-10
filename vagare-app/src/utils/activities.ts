import { Activity } from '@/services/activities';
import { dayNumberInTrip } from './format';

export interface DayGroup {
  date: string;
  dayNumber: number;
  activities: Activity[];
}

export function groupByDay(activities: Activity[], tripStartDate: string): DayGroup[] {
  const groups = new Map<string, Activity[]>();

  for (const activity of activities) {
    const key = activity.date.slice(0, 10);
    const existing = groups.get(key) ?? [];
    existing.push(activity);
    groups.set(key, existing);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, dayActivities]) => ({
      date,
      dayNumber: dayNumberInTrip(tripStartDate, date),
      activities: dayActivities,
    }));
}

export function tripDayDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let current = start; current <= end; current = new Date(current.getTime() + 86400000)) {
    dates.push(current.toISOString().slice(0, 10));
  }

  return dates;
}
