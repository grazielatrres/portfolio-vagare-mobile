import { Activity } from './activities';
import { getDatabase } from './database';
import { logError } from './logger';

export async function getCachedActivities(tripId: string): Promise<Activity[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Activity>(
      'SELECT * FROM activities WHERE tripId = ? ORDER BY date ASC',
      [tripId],
    );
  } catch (error) {
    logError('activitiesCache.getCachedActivities', error);
    return [];
  }
}

export async function saveActivitiesToCache(tripId: string, activities: Activity[]): Promise<void> {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM activities WHERE tripId = ?', [tripId]);

      for (const activity of activities) {
        await db.runAsync(
          `INSERT INTO activities (id, tripId, name, date, time, location, period, category, estimatedCost, description)
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
