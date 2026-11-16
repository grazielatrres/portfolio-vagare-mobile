import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { CreateExpensePayload, buildExpenseFromPayload, updateExpense } from '@/services/expenses';
import { upsertExpenseToCache } from '@/services/expensesCache';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, resolveSyncedId } from '@/services/syncQueue';
import { OFFLINE_SAVED_TOAST } from '@/utils/offlineToasts';
import { budgetQueryKey } from './useBudgetQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export interface UpdateExpenseVariables {
  id: string;
  payload: CreateExpensePayload;
}

export function useUpdateExpenseMutation(rawTripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id: rawId, payload }: UpdateExpenseVariables) => {
      const id = resolveSyncedId(rawId);
      const tripId = resolveSyncedId(rawTripId);
      try {
        return await updateExpense(token as string, tripId, id, payload);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildExpenseFromPayload(id, tripId, payload);
          await upsertExpenseToCache(local);
          await enqueueMutation({
            tripId,
            entityType: 'expense',
            operation: 'update',
            localId: id,
            payload,
          });
          showToast(OFFLINE_SAVED_TOAST);
          return local;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKey(rawTripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(rawTripId) });
    },
  });
}
