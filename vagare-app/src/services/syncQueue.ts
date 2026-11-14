import * as Crypto from 'expo-crypto';

import {
  removeActivityFromCache,
  upsertActivityToCache,
} from './activitiesCache';
import { createActivity, deleteActivity, updateActivity } from './activities';
import { ApiError } from './api';
import { getDatabase } from './database';
import { LOCAL_ID_PREFIX, isLocalId } from './localId';
import {
  removeExpenseFromCache,
  upsertExpenseToCache,
} from './expensesCache';
import { createExpense, deleteExpense, updateExpense } from './expenses';
import { createInfo, deleteInfo, updateInfo } from './infos';
import { removeInfoFromCache, upsertInfoToCache } from './infosCache';
import { logError } from './logger';
import { queryClient } from './queryClient';
import { createTrip, deleteTrip } from './trips';
import { removeTripFromCache, replaceLocalTrip } from './tripsCache';

export type EntityType = 'trip' | 'activity' | 'expense' | 'info';
export type Operation = 'create' | 'update' | 'delete';

export interface PendingMutation {
  id: string;
  tripId: string;
  entityType: EntityType;
  operation: Operation;
  localId: string;
  payload: string;
  createdAt: string;
}

export { LOCAL_ID_PREFIX, isLocalId };

export function generateLocalId(): string {
  return `${LOCAL_ID_PREFIX}${Crypto.randomUUID()}`;
}

export async function enqueueMutation(input: {
  tripId: string;
  entityType: EntityType;
  operation: Operation;
  localId: string;
  payload: unknown;
}): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO pending_mutations (id, tripId, entityType, operation, localId, payload, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Crypto.randomUUID(),
        input.tripId,
        input.entityType,
        input.operation,
        input.localId,
        JSON.stringify(input.payload),
        new Date().toISOString(),
      ],
    );
  } catch (error) {
    logError('syncQueue.enqueueMutation', error);
  }
}

export async function getPendingMutations(tripId: string): Promise<PendingMutation[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<PendingMutation>(
      'SELECT * FROM pending_mutations WHERE tripId = ? ORDER BY createdAt ASC',
      [tripId],
    );
  } catch (error) {
    logError('syncQueue.getPendingMutations', error);
    return [];
  }
}

// Exclusão offline de uma viagem que já existe no servidor: some do cache na
// hora e o DELETE vai para a fila. Alterações pendentes dentro dela perdem o
// sentido (o servidor apagaria tudo junto), então são descartadas.
export async function queueTripDeletion(tripId: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM pending_mutations WHERE tripId = ?', [tripId]);
  } catch (error) {
    logError('syncQueue.queueTripDeletion', error);
  }

  await removeTripFromCache(tripId);
  await enqueueMutation({
    tripId,
    entityType: 'trip',
    operation: 'delete',
    localId: tripId,
    payload: null,
  });
}

// Ids de viagens excluídas offline cujo DELETE ainda não chegou ao servidor.
export async function getPendingTripDeletionIds(): Promise<Set<string>> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ tripId: string }>(
      "SELECT tripId FROM pending_mutations WHERE entityType = 'trip' AND operation = 'delete'",
    );
    return new Set(rows.map((row) => row.tripId));
  } catch (error) {
    logError('syncQueue.getPendingTripDeletionIds', error);
    return new Set();
  }
}

// Remove da fila e do cache uma entidade que nunca saiu do dispositivo (ex.:
// criada offline e excluída antes de sincronizar) — não há nada a enviar.
export async function discardLocalEntity(entityType: EntityType, localId: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM pending_mutations WHERE localId = ?', [localId]);
    if (entityType === 'trip') {
      // Tudo o que foi feito dentro da viagem local também morre com ela.
      await db.runAsync('DELETE FROM pending_mutations WHERE tripId = ?', [localId]);
    }
  } catch (error) {
    logError('syncQueue.discardLocalEntity', error);
  }

  await removeFromCache(entityType, localId);
}

async function removeFromCache(entityType: EntityType, id: string): Promise<void> {
  switch (entityType) {
    case 'trip':
      await removeTripFromCache(id);
      break;
    case 'activity':
      await removeActivityFromCache(id);
      break;
    case 'expense':
      await removeExpenseFromCache(id);
      break;
    case 'info':
      await removeInfoFromCache(id);
      break;
  }
}

async function applyMutation(
  token: string,
  mutation: PendingMutation,
  resolvedId: string,
  tripId: string,
  idMap: Map<string, string>,
): Promise<void> {
  const payload = JSON.parse(mutation.payload);

  if (mutation.entityType === 'trip') {
    if (mutation.operation === 'create') {
      const created = await createTrip(token, payload);
      idMap.set(mutation.localId, created.id);
      await replaceLocalTrip(mutation.localId, created);
    } else if (mutation.operation === 'delete') {
      await deleteTrip(token, resolvedId);
      await removeTripFromCache(resolvedId);
    }
    return;
  }

  if (mutation.entityType === 'activity') {
    if (mutation.operation === 'create') {
      const created = await createActivity(token, tripId, payload);
      idMap.set(mutation.localId, created.id);
      await removeActivityFromCache(mutation.localId);
      await upsertActivityToCache(created);
    } else if (mutation.operation === 'update') {
      const updated = await updateActivity(token, tripId, resolvedId, payload);
      await upsertActivityToCache(updated);
    } else {
      await deleteActivity(token, tripId, resolvedId);
      await removeActivityFromCache(resolvedId);
    }
    return;
  }

  if (mutation.entityType === 'expense') {
    if (mutation.operation === 'create') {
      const created = await createExpense(token, tripId, payload);
      idMap.set(mutation.localId, created.id);
      await removeExpenseFromCache(mutation.localId);
      await upsertExpenseToCache(created);
    } else if (mutation.operation === 'update') {
      const updated = await updateExpense(token, tripId, resolvedId, payload);
      await upsertExpenseToCache(updated);
    } else {
      await deleteExpense(token, tripId, resolvedId);
      await removeExpenseFromCache(resolvedId);
    }
    return;
  }

  if (mutation.operation === 'create') {
    const created = await createInfo(token, tripId, payload);
    idMap.set(mutation.localId, created.id);
    await removeInfoFromCache(mutation.localId);
    await upsertInfoToCache(created);
  } else if (mutation.operation === 'update') {
    const updated = await updateInfo(token, tripId, resolvedId, payload);
    await upsertInfoToCache(updated);
  } else {
    await deleteInfo(token, tripId, resolvedId);
    await removeInfoFromCache(resolvedId);
  }
}

export async function clearPendingMutations(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM pending_mutations');
  } catch (error) {
    logError('syncQueue.clearPendingMutations', error);
  }
}

let isDraining = false;

// Estado "sincronizando" observável pela UI: só fica true enquanto há
// alterações de fato sendo enviadas (fila vazia não mostra loading).
let isSyncing = false;
const syncStatusListeners = new Set<() => void>();

function setSyncing(next: boolean): void {
  if (isSyncing === next) {
    return;
  }
  isSyncing = next;
  syncStatusListeners.forEach((listener) => listener());
}

export function getIsSyncing(): boolean {
  return isSyncing;
}

export function subscribeSyncStatus(listener: () => void): () => void {
  syncStatusListeners.add(listener);
  return () => syncStatusListeners.delete(listener);
}

export async function drainPendingMutations(token: string | null): Promise<void> {
  if (!token || isDraining) {
    return;
  }

  isDraining = true;
  try {
    const db = await getDatabase();
    const mutations = await db.getAllAsync<PendingMutation>(
      'SELECT * FROM pending_mutations ORDER BY createdAt ASC',
    );

    if (mutations.length > 0) {
      setSyncing(true);
    }

    const idMap = new Map<string, string>();
    const affectedTripIds = new Set<string>();
    const discardedTripIds = new Set<string>();
    let syncedTrip = false;

    for (const mutation of mutations) {
      if (discardedTripIds.has(mutation.tripId)) {
        // A viagem local foi rejeitada pelo servidor; seus itens já foram descartados.
        continue;
      }

      const resolvedId = idMap.get(mutation.localId) ?? mutation.localId;
      const resolvedTripId = idMap.get(mutation.tripId) ?? mutation.tripId;

      try {
        await applyMutation(token, mutation, resolvedId, resolvedTripId, idMap);
        await db.runAsync('DELETE FROM pending_mutations WHERE id = ?', [mutation.id]);
        if (mutation.entityType === 'trip') {
          syncedTrip = true;
          affectedTripIds.add(idMap.get(mutation.localId) ?? resolvedId);
        } else {
          affectedTripIds.add(resolvedTripId);
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 0 || error.status === 401)) {
          // Ainda offline ou token recusado: para aqui e preserva a ordem do que resta na fila.
          break;
        }
        // Rejeição real do servidor (ex.: validação) — descarta para não
        // bloquear a fila para sempre.
        logError('syncQueue.drainPendingMutations', error);
        await db.runAsync('DELETE FROM pending_mutations WHERE id = ?', [mutation.id]);
        if (mutation.entityType === 'trip') {
          // Recarrega a lista: uma exclusão recusada faz a viagem reaparecer.
          syncedTrip = true;
        }
        if (mutation.entityType === 'trip' && isLocalId(resolvedId)) {
          await discardLocalEntity('trip', resolvedId);
          discardedTripIds.add(resolvedId);
          continue;
        }
        if (mutation.operation === 'create' && isLocalId(resolvedId)) {
          await removeFromCache(mutation.entityType, resolvedId);
        }
        affectedTripIds.add(resolvedTripId);
      }
    }

    // Aguarda o refetch antes de desligar o "sincronizando", para a UI não
    // piscar o estado antigo (ex.: "aguardando sincronização") nesse meio-tempo.
    await Promise.all([
      syncedTrip ? queryClient.invalidateQueries({ queryKey: ['trips'], exact: true }) : null,
      ...[...affectedTripIds].map((tripId) =>
        queryClient.invalidateQueries({ queryKey: ['trips', tripId] }),
      ),
    ]);
  } catch (error) {
    logError('syncQueue.drainPendingMutations', error);
  } finally {
    isDraining = false;
    setSyncing(false);
  }
}
