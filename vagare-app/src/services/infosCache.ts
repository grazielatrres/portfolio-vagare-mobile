import { getDatabase } from './database';
import { Info } from './infos';
import { logError } from './logger';

type InfoRow = Omit<Info, 'details'> & { details: string | null };

function rowToInfo(row: InfoRow): Info {
  return {
    ...row,
    details: row.details ? JSON.parse(row.details) : null,
  };
}

function infoToRowParams(info: Info): [string, string, string, string, string | null, string | null, string | null] {
  return [
    info.id,
    info.tripId,
    info.type,
    info.title,
    info.description,
    info.date,
    info.details ? JSON.stringify(info.details) : null,
  ];
}

export async function getCachedInfos(tripId: string): Promise<Info[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<InfoRow>('SELECT * FROM infos WHERE tripId = ?', [tripId]);
    return rows.map(rowToInfo);
  } catch (error) {
    logError('infosCache.getCachedInfos', error);
    return [];
  }
}

export async function saveInfosToCache(tripId: string, infos: Info[]): Promise<void> {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM infos WHERE tripId = ?', [tripId]);

      for (const info of infos) {
        await db.runAsync(
          `INSERT INTO infos (id, tripId, type, title, description, date, details)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          infoToRowParams(info),
        );
      }
    });
  } catch (error) {
    logError('infosCache.saveInfosToCache', error);
  }
}

export async function upsertInfoToCache(info: Info): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO infos (id, tripId, type, title, description, date, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      infoToRowParams(info),
    );
  } catch (error) {
    logError('infosCache.upsertInfoToCache', error);
  }
}

export async function removeInfoFromCache(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM infos WHERE id = ?', [id]);
  } catch (error) {
    logError('infosCache.removeInfoFromCache', error);
  }
}

export async function clearInfosCache(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM infos');
  } catch (error) {
    logError('infosCache.clearInfosCache', error);
  }
}
