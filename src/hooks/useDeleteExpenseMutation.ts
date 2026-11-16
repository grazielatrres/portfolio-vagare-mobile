import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { deleteExpense } from '@/services/expenses';
import { removeExpenseFromCache } from '@/services/expensesCache';
import { queryClient } from '@/services/queryClient';
import { discardLocalEntity, enqueueMutation, isLocalId, resolveSyncedId } from '@/services/syncQueue';
import { OFFLINE_DELETED_TOAST } from '@/utils/offlineToasts';
import { budgetQueryKey } from './useBudgetQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useDeleteExpenseMutation(rawTripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (rawId: string) => {
      const id = resolveSyncedId(rawId);
      const tripId = resolveSyncedId(rawTripId);
      try {
        await deleteExpense(token as string, tripId, id);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          if (isLocalId(id)) {
            // Nunca existiu no servidor — não há nada a sincronizar.
            await discardLocalEntity('expense', id);
          } else {
            await removeExpenseFromCache(id);
            await enqueueMutation({
              tripId,
              entityType: 'expense',
              operation: 'delete',
              localId: id,
              payload: null,
            });
          }
          showToast(OFFLINE_DELETED_TOAST);
          return;
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
