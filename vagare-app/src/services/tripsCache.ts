import { getDatabase } from './database';
import { Trip } from './trips';

export async function getCachedTrips(): Promise<Trip[]> {
  const db = await getDatabase();
  return db.getAllAsync<Trip>('SELECT * FROM trips ORDER BY startDate ASC');
}

export async function saveTripsToCache(trips: Trip[]): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM trips');

    for (const trip of trips) {
      await db.runAsync(
        `INSERT INTO trips (id, userId, name, destination, startDate, endDate, budget, numberOfPeople, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trip.id,
          trip.userId,
          trip.name,
          trip.destination,
          trip.startDate,
          trip.endDate,
          trip.budget,
          trip.numberOfPeople,
          trip.createdAt,
          trip.updatedAt,
        ],
      );
    }
  });
}

export async function clearTripsCache(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM trips');
}
