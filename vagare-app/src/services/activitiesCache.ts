import { Activity } from './activities';
import { getDatabase } from './database';
import { LOCAL_ID_PREFIX } from './localId';
import { logError } from './logger';
import { NO_PENDING_MUTATION_SQL, PENDING_IDS_SQL } from './pendingGuard';
import { runInTransaction } from './transactionQueue';

export async function getCachedActivities(tripId: string): Promise<Activity[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Activity>(
      // Mesma ordem do servidor (Postgres põe horário nulo por último).
      'SELECT * FROM activities WHERE tripId = ? ORDER BY date ASC, time IS NULL, time ASC',
      [tripId],
    );
  } catch (error) {
    logError('activitiesCache.getCachedActivities', error);
    return [];
  }
}

export async function getCachedActivityCounts(): Promise<Record<string, number>> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ tripId: string; total: number }>(
      'SELECT tripId, COUNT(*) AS total FROM activities GROUP BY tripId',
    );
    return Object.fromEntries(rows.map((row) => [row.tripId, row.total]));
  } catch (error) {
    logError('activitiesCache.getCachedActivityCounts', error);
    return {};
  }
}

export async function saveActivitiesToCache(tripId: string, activities: Activity[]): Promise<void> {
  try {
    const db = await getDatabase();

    await runInTransaction(db, async () => {
      await db.runAsync(
        `DELETE FROM activities WHERE tripId = ? AND id NOT LIKE '${LOCAL_ID_PREFIX}%'
         AND id NOT IN (${PENDING_IDS_SQL})`,
        [tripId],
      );

      for (const activity of activities) {
        await db.runAsync(
          `INSERT INTO activities (id, tripId, name, date, time, location, period, category, estimatedCost, description)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${NO_PENDING_MUTATION_SQL}`,
          [
            activity.id,
            activity.tripId,
            activity.name,
            activity.date,
            activity.time,
            activity.location,
            activity.period,
            activity.category,
            activity.estimatedCost,
            activity.description,
            activity.id,
          ],
        );
      }
    });
  } catch (error) {
    logError('activitiesCache.saveActivitiesToCache', error);
  }
}

export async function upsertActivityToCache(activity: Activity): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO activities (id, tripId, name, date, time, location, period, category, estimatedCost, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity.id,
        activity.tripId,
        activity.name,
        activity.date,
        activity.time,
        activity.location,
        activity.period,
        activity.category,
        activity.estimatedCost,
        activity.description,
      ],
    );
  } catch (error) {
    logError('activitiesCache.upsertActivityToCache', error);
  }
}

export async function removeActivityFromCache(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
  } catch (error) {
    logError('activitiesCache.removeActivityFromCache', error);
  }
}

export async function clearActivitiesCache(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM activities');
  } catch (error) {
    logError('activitiesCache.clearActivitiesCache', error);
  }
}
