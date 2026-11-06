import { renderHook, waitFor } from '@testing-library/react-native';

import { budgetQueryKey } from '@/hooks/useBudgetQuery';
import { useCreateExpenseMutation } from '@/hooks/useCreateExpenseMutation';
import { queryClient } from '@/services/queryClient';
import { buildExpense } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/expenses');

import { createExpense } from '@/services/expenses';

const createExpenseMock = createExpense as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCreateExpenseMutation', () => {
  it('cria o gasto e invalida o orçamento da viagem', async () => {
    const expense = buildExpense();
    createExpenseMock.mockResolvedValue(expense);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateExpenseMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    const payload = { description: expense.description, amount: 120 };
    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createExpenseMock).toHaveBeenCalledWith('test-token', 'trip-1', payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetQueryKey('trip-1') });

    invalidateSpy.mockRestore();
  });
});
