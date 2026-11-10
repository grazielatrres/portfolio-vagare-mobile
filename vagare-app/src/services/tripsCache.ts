import { getDatabase } from './database';
import { logError } from './logger';
import { Trip } from './trips';

export async function getCachedTrips(): Promise<Trip[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Trip>('SELECT * FROM trips ORDER BY startDate ASC');
  } catch (error) {
    logError('tripsCache.getCachedTrips', error);
    return [];
  }
}

export async function saveTripsToCache(trips: Trip[]): Promise<void> {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM trips');

      for (const trip of trips) {
        await db.runAsync(
          `INSERT INTO trips (id, userId, name, destination, startDate, endDate, budget, currency, numberOfPeople, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            trip.id,
            trip.userId,
            trip.name,
            trip.destination,
            trip.startDate,
            trip.endDate,
            trip.budget,
            trip.currency,
            trip.numberOfPeople,
            trip.createdAt,
            trip.updatedAt,
          ],
        );
      }
    });
  } catch (error) {
    logError('tripsCache.saveTripsToCache', error);
  }
}

export async function getCachedTripById(tripId: string): Promise<Trip | null> {
  const trips = await getCachedTrips();
  return trips.find((trip) => trip.id === tripId) ?? null;
}

export async function clearTripsCache(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM trips');
  } catch (error) {
    logError('tripsCache.clearTripsCache', error);
  }
}
