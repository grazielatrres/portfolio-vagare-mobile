import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { CreateExpensePayload, buildExpenseFromPayload, createExpense } from '@/services/expenses';
import { upsertExpenseToCache } from '@/services/expensesCache';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, generateLocalId } from '@/services/syncQueue';
import { OFFLINE_SAVED_TOAST } from '@/utils/offlineToasts';
import { budgetQueryKey } from './useBudgetQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useCreateExpenseMutation(tripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      // Gerado antes da tentativa: serve de Idempotency-Key e, se a resposta não
      // chegar, de id local. O reenvio pela fila usa a mesma chave e não duplica.
      const localId = generateLocalId();
      try {
        return await createExpense(token as string, tripId, payload, localId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildExpenseFromPayload(localId, tripId, payload);
          await upsertExpenseToCache(local);
          await enqueueMutation({
            tripId,
            entityType: 'expense',
            operation: 'create',
            localId: local.id,
            payload,
          });
          showToast(OFFLINE_SAVED_TOAST);
          return local;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKey(tripId) });
      queryClient.invalidateQueries({ queryKey: pendingMutationsQueryKey(tripId) });
    },
  });
}
