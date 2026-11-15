import { getDatabase } from './database';
import { LOCAL_ID_PREFIX } from './localId';
import { logError } from './logger';
import { runInTransaction } from './transactionQueue';
import { Trip } from './trips';

const INSERT_TRIP_COLUMNS =
  '(id, userId, name, destination, startDate, endDate, budget, currency, numberOfPeople, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

function tripParams(trip: Trip) {
  return [
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
  ];
}

export async function getCachedTrips(): Promise<Trip[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Trip>('SELECT * FROM trips ORDER BY startDate ASC');
  } catch (error) {
    logError('tripsCache.getCachedTrips', error);
    return [];
  }
}

export async function getLocalOnlyTrips(): Promise<Trip[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Trip>(
      `SELECT * FROM trips WHERE id LIKE '${LOCAL_ID_PREFIX}%' ORDER BY startDate ASC`,
    );
  } catch (error) {
    logError('tripsCache.getLocalOnlyTrips', error);
    return [];
  }
}

export async function saveTripsToCache(trips: Trip[]): Promise<void> {
  try {
    const db = await getDatabase();

    await runInTransaction(db, async () => {
      await db.runAsync(`DELETE FROM trips WHERE id NOT LIKE '${LOCAL_ID_PREFIX}%'`);

      for (const trip of trips) {
        await db.runAsync(`INSERT INTO trips ${INSERT_TRIP_COLUMNS}`, tripParams(trip));
      }
    });
  } catch (error) {
    logError('tripsCache.saveTripsToCache', error);
  }
}

export async function upsertTripToCache(trip: Trip): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(`INSERT OR REPLACE INTO trips ${INSERT_TRIP_COLUMNS}`, tripParams(trip));
  } catch (error) {
    logError('tripsCache.upsertTripToCache', error);
  }
}

export async function removeTripFromCache(tripId: string): Promise<void> {
  try {
    const db = await getDatabase();
    await runInTransaction(db, async () => {
      await db.runAsync('DELETE FROM activities WHERE tripId = ?', [tripId]);
      await db.runAsync('DELETE FROM expenses WHERE tripId = ?', [tripId]);
      await db.runAsync('DELETE FROM infos WHERE tripId = ?', [tripId]);
      await db.runAsync('DELETE FROM trips WHERE id = ?', [tripId]);
    });
  } catch (error) {
    logError('tripsCache.removeTripFromCache', error);
  }
}

export async function replaceLocalTrip(localId: string, created: Trip): Promise<void> {
  try {
    const db = await getDatabase();
    await runInTransaction(db, async () => {
      await db.runAsync('DELETE FROM trips WHERE id = ?', [localId]);
      await db.runAsync(`INSERT OR REPLACE INTO trips ${INSERT_TRIP_COLUMNS}`, tripParams(created));
      await db.runAsync('UPDATE activities SET tripId = ? WHERE tripId = ?', [created.id, localId]);
      await db.runAsync('UPDATE expenses SET tripId = ? WHERE tripId = ?', [created.id, localId]);
      await db.runAsync('UPDATE infos SET tripId = ? WHERE tripId = ?', [created.id, localId]);
      await db.runAsync('UPDATE pending_mutations SET tripId = ? WHERE tripId = ?', [
        created.id,
        localId,
      ]);
    });
  } catch (error) {
    logError('tripsCache.replaceLocalTrip', error);
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
