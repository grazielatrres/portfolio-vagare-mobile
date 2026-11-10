import { apiRequest } from './api';

export interface DailyForecast {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
}

export function getTripWeather(token: string, tripId: string) {
  return apiRequest<DailyForecast[]>(`/trips/${tripId}/weather`, { token });
}
