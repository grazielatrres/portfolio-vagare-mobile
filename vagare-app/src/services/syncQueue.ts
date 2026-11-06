import * as Crypto from 'expo-crypto';

import {
  removeActivityFromCache,
  upsertActivityToCache,
} from './activitiesCache';
import { createActivity, deleteActivity, updateActivity } from './activities';
import { ApiError } from './api';
import { getDatabase } from './database';
import {
  removeExpenseFromCache,
  upsertExpenseToCache,
} from './expensesCache';
import { createExpense, deleteExpense, updateExpense } from './expenses';
import { createInfo, deleteInfo, updateInfo } from './infos';
import { removeInfoFromCache, upsertInfoToCache } from './infosCache';
import { logError } from './logger';
import { queryClient } from './queryClient';

export type EntityType = 'activity' | 'expense' | 'info';
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

export const LOCAL_ID_PREFIX = 'local-';

export function generateLocalId(): string {
  return `${LOCAL_ID_PREFIX}${Crypto.randomUUID()}`;
}

export function isLocalId(id: string): boolean {
  return id.startsWith(LOCAL_ID_PREFIX);
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

// Remove da fila e do cache uma entidade que nunca saiu do dispositivo (ex.:
// criada offline e excluída antes de sincronizar) — não há nada a enviar.
export async function discardLocalEntity(entityType: EntityType, localId: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM pending_mutations WHERE localId = ?', [localId]);
  } catch (error) {
    logError('syncQueue.discardLocalEntity', error);
  }

  switch (entityType) {
    case 'activity':
      await removeActivityFromCache(localId);
      break;
    case 'expense':
      await removeExpenseFromCache(localId);
      break;
    case 'info':
      await removeInfoFromCache(localId);
      break;
  }
}

async function applyMutation(
  token: string,
  mutation: PendingMutation,
  resolvedId: string,
  idMap: Map<string, string>,
): Promise<void> {
  const payload = JSON.parse(mutation.payload);

  if (mutation.entityType === 'activity') {
    if (mutation.operation === 'create') {
      const created = await createActivity(token, mutation.tripId, payload);
      idMap.set(mutation.localId, created.id);
      await removeActivityFromCache(mutation.localId);
      await upsertActivityToCache(created);
    } else if (mutation.operation === 'update') {
      const updated = await updateActivity(token, mutation.tripId, resolvedId, payload);
      await upsertActivityToCache(updated);
    } else {
      await deleteActivity(token, mutation.tripId, resolvedId);
      await removeActivityFromCache(resolvedId);
    }
    return;
  }

  if (mutation.entityType === 'expense') {
    if (mutation.operation === 'create') {
      const created = await createExpense(token, mutation.tripId, payload);
      idMap.set(mutation.localId, created.id);
      await removeExpenseFromCache(mutation.localId);
      await upsertExpenseToCache(created);
    } else if (mutation.operation === 'update') {
      const updated = await updateExpense(token, mutation.tripId, resolvedId, payload);
      await upsertExpenseToCache(updated);
    } else {
      await deleteExpense(token, mutation.tripId, resolvedId);
      await removeExpenseFromCache(resolvedId);
    }
    return;
  }

  if (mutation.operation === 'create') {
    const created = await createInfo(token, mutation.tripId, payload);
    idMap.set(mutation.localId, created.id);
    await removeInfoFromCache(mutation.localId);
    await upsertInfoToCache(created);
  } else if (mutation.operation === 'update') {
    const updated = await updateInfo(token, mutation.tripId, resolvedId, payload);
    await upsertInfoToCache(updated);
  } else {
    await deleteInfo(token, mutation.tripId, resolvedId);
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

    const idMap = new Map<string, string>();
    const affectedTripIds = new Set<string>();

    for (const mutation of mutations) {
      const resolvedId = idMap.get(mutation.localId) ?? mutation.localId;

      try {
        await applyMutation(token, mutation, resolvedId, idMap);
        await db.runAsync('DELETE FROM pending_mutations WHERE id = ?', [mutation.id]);
        affectedTripIds.add(mutation.tripId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 0) {
          // Ainda offline: para aqui e preserva a ordem do que resta na fila.
          break;
        }
        // Rejeição real do servidor (ex.: validação) — descarta para não
        // bloquear a fila para sempre.
        logError('syncQueue.drainPendingMutations', error);
        await db.runAsync('DELETE FROM pending_mutations WHERE id = ?', [mutation.id]);
        affectedTripIds.add(mutation.tripId);
      }
    }

    for (const tripId of affectedTripIds) {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] });
    }
  } catch (error) {
    logError('syncQueue.drainPendingMutations', error);
  } finally {
    isDraining = false;
  }
}
