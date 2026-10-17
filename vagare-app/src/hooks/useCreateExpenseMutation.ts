import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/services/queryClient';
import { CreateExpensePayload, createExpense } from '@/services/expenses';
import { budgetQueryKey } from './useBudgetQuery';

export function useCreateExpenseMutation(tripId: string) {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      createExpense(token as string, tripId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetQueryKey(tripId) });
    },
  });
}
