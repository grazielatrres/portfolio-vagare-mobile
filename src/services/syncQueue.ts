import * as Crypto from 'expo-crypto';

import {
  removeActivityFromCache,
  upsertActivityToCache,
} from './activitiesCache';
import { createActivity, deleteActivity, updateActivity } from './activities';
import { ApiError, isNetworkFailure } from './api';
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
import { createTrip, deleteTrip, updateTrip } from './trips';
import { removeTripFromCache, replaceLocalTrip, upsertTripToCache } from './tripsCache';

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

// id local → id do servidor, para telas e alterações que ainda usam o id local.
const syncedIds = new Map<string, string>();

export function resolveSyncedId(id: string): string {
  return isLocalId(id) ? (syncedIds.get(id) ?? id) : id;
}

// Pendências dentro da viagem são descartadas: o servidor apaga tudo junto.
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

export async function countPendingMutations(): Promise<number> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM pending_mutations',
    );
    return row?.total ?? 0;
  } catch (error) {
    logError('syncQueue.countPendingMutations', error);
    return 0;
  }
}

export async function hasPendingMutationsForTrip(tripId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM pending_mutations WHERE tripId = ? LIMIT 1',
      [tripId],
    );
    return row != null;
  } catch (error) {
    logError('syncQueue.hasPendingMutationsForTrip', error);
    return false;
  }
}

export async function hasPendingMutations(): Promise<boolean> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM pending_mutations LIMIT 1');
    return row != null;
  } catch (error) {
    logError('syncQueue.hasPendingMutations', error);
    return false;
  }
}

// Remove da fila e do cache uma entidade que nunca saiu do dispositivo (ex.:
// criada offline e excluída antes de sincronizar) — não há nada a enviar.
export async function discardLocalEntity(entityType: EntityType, localId: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM pending_mutations WHERE localId = ?', [localId]);
    if (entityType === 'trip') {
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
): Promise<void> {
  const payload = JSON.parse(mutation.payload);

  if (mutation.entityType === 'trip') {
    if (mutation.operation === 'create') {
      const created = await createTrip(token, payload, mutation.localId);
      syncedIds.set(mutation.localId, created.id);
      await replaceLocalTrip(mutation.localId, created);
    } else if (mutation.operation === 'update') {
      const updated = await updateTrip(token, resolvedId, payload);
      await upsertTripToCache(updated);
    } else if (mutation.operation === 'delete') {
      await deleteTrip(token, resolvedId);
      await removeTripFromCache(resolvedId);
    }
    return;
  }

  if (mutation.entityType === 'activity') {
    if (mutation.operation === 'create') {
      const created = await createActivity(token, tripId, payload, mutation.localId);
      syncedIds.set(mutation.localId, created.id);
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
      const created = await createExpense(token, tripId, payload, mutation.localId);
      syncedIds.set(mutation.localId, created.id);
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
    const created = await createInfo(token, tripId, payload, mutation.localId);
    syncedIds.set(mutation.localId, created.id);
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
  syncedIds.clear();
}

// Chamadas concorrentes aguardam a mesma drenagem (ex.: o logout espera a sincronização).
let currentDrain: Promise<void> | null = null;

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

export function drainPendingMutations(token: string | null): Promise<void> {
  if (!token) {
    return Promise.resolve();
  }
  if (!currentDrain) {
    currentDrain = runDrain(token).finally(() => {
      currentDrain = null;
    });
  }
  return currentDrain;
}

async function runDrain(token: string): Promise<void> {
  try {
    const db = await getDatabase();
    const mutations = await db.getAllAsync<PendingMutation>(
      'SELECT * FROM pending_mutations ORDER BY createdAt ASC',
    );

    if (mutations.length > 0) {
      setSyncing(true);
    }

    const affectedTripIds = new Set<string>();
    const discardedTripIds = new Set<string>();
    let syncedTrip = false;

    for (const mutation of mutations) {
      if (discardedTripIds.has(mutation.tripId)) {
        continue;
      }

      const resolvedId = resolveSyncedId(mutation.localId);
      const resolvedTripId = resolveSyncedId(mutation.tripId);

      try {
        await applyMutation(token, mutation, resolvedId, resolvedTripId);
        await db.runAsync('DELETE FROM pending_mutations WHERE id = ?', [mutation.id]);
        if (mutation.entityType === 'trip') {
          syncedTrip = true;
          affectedTripIds.add(resolveSyncedId(mutation.localId));
          // Telas abertas com o id local precisam recarregar.
          affectedTripIds.add(mutation.localId);
        } else {
          affectedTripIds.add(resolvedTripId);
        }
      } catch (error) {
        const isRetryable =
          isNetworkFailure(error) ||
          (error instanceof ApiError &&
            // 409 numa criação: a tentativa original ainda está em processamento.
            (error.status === 401 || (error.status === 409 && mutation.operation === 'create')));
        if (isRetryable) {
          // Para aqui e preserva a ordem do que resta na fila.
          break;
        }
        // Rejeição real do servidor (ex.: validação) — descarta para não
        // bloquear a fila para sempre.
        logError('syncQueue.drainPendingMutations', error);
        await db.runAsync('DELETE FROM pending_mutations WHERE id = ?', [mutation.id]);
        if (mutation.entityType === 'trip') {
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

    // Aguarda o refetch para a UI não piscar o estado antigo.
    await Promise.all([
      syncedTrip ? queryClient.invalidateQueries({ queryKey: ['trips'], exact: true }) : null,
      ...[...affectedTripIds].map((tripId) =>
        queryClient.invalidateQueries({ queryKey: ['trips', tripId] }),
      ),
    ]);
  } catch (error) {
    logError('syncQueue.drainPendingMutations', error);
  } finally {
    setSyncing(false);
  }
}
