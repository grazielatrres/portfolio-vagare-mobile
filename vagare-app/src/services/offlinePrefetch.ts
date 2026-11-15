import { listActivities } from './activities';
import { saveActivitiesToCache } from './activitiesCache';
import { ApiError } from './api';
import { getBudgetSummary } from './budget';
import { saveExpensesToCache } from './expensesCache';
import { listInfos } from './infos';
import { saveInfosToCache } from './infosCache';
import { logError } from './logger';
import { Trip } from './trips';

const MIN_INTERVAL_MS = 5 * 60 * 1000;

let lastRunAt = 0;
let isRunning = false;

export async function prefetchTripsForOffline(token: string, trips: Trip[]): Promise<void> {
  if (isRunning || Date.now() - lastRunAt < MIN_INTERVAL_MS) {
    return;
  }

  isRunning = true;
  try {
    for (const trip of trips) {
      const results = await Promise.allSettled([
        listActivities(token, trip.id).then((items) => saveActivitiesToCache(trip.id, items)),
        listInfos(token, trip.id).then((items) => saveInfosToCache(trip.id, items)),
        getBudgetSummary(token, trip.id).then((summary) =>
          saveExpensesToCache(trip.id, summary.expenses.items),
        ),
      ]);

      const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failures.some((f) => f.reason instanceof ApiError && f.reason.status === 0)) {
        return;
      }
      failures.forEach((f) => logError('offlinePrefetch', f.reason));
    }
    lastRunAt = Date.now();
  } finally {
    isRunning = false;
  }
}

export function resetOfflinePrefetch(): void {
  lastRunAt = 0;
}
