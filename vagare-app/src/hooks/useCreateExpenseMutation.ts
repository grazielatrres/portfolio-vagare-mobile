import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiError } from '@/services/api';
import { CreateExpensePayload, buildExpenseFromPayload, createExpense } from '@/services/expenses';
import { upsertExpenseToCache } from '@/services/expensesCache';
import { queryClient } from '@/services/queryClient';
import { enqueueMutation, generateLocalId } from '@/services/syncQueue';
import { budgetQueryKey } from './useBudgetQuery';
import { pendingMutationsQueryKey } from './usePendingMutationsQuery';

export function useCreateExpenseMutation(tripId: string) {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      try {
        return await createExpense(token as string, tripId, payload);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          const local = buildExpenseFromPayload(generateLocalId(), tripId, payload);
          await upsertExpenseToCache(local);
          await enqueueMutation({
            tripId,
            entityType: 'expense',
            operation: 'create',
            localId: local.id,
            payload,
          });
          showToast({
            title: 'Salvo localmente',
            message: 'Será sincronizado quando a conexão voltar.',
          });
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
