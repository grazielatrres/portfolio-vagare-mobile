import { renderHook, waitFor } from '@testing-library/react-native';

import { budgetQueryKey } from '@/hooks/useBudgetQuery';
import { useDeleteExpenseMutation } from '@/hooks/useDeleteExpenseMutation';
import { useUpdateExpenseMutation } from '@/hooks/useUpdateExpenseMutation';
import { ApiError } from '@/services/api';
import { deleteExpense, updateExpense } from '@/services/expenses';
import { removeExpenseFromCache, upsertExpenseToCache } from '@/services/expensesCache';
import { queryClient } from '@/services/queryClient';
import { discardLocalEntity, enqueueMutation } from '@/services/syncQueue';
import { buildExpense } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/ToastContext', () => require('./helpers/mockToast').toastContextMock);
jest.mock('@/services/expenses', () => ({
  ...jest.requireActual('@/services/expenses'),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));
jest.mock('@/services/expensesCache');
jest.mock('@/services/syncQueue', () => ({
  enqueueMutation: jest.fn(),
  discardLocalEntity: jest.fn(),
  resolveSyncedId: (id: string) => id,
  isLocalId: (id: string) => id.startsWith('local-'),
}));

const updateExpenseMock = updateExpense as jest.Mock;
const deleteExpenseMock = deleteExpense as jest.Mock;
const offline = new ApiError(0, 'Sem conexão');
const payload = { description: 'Jantar', amount: 120.5, currency: 'BRL', category: 'Alimentação' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useUpdateExpenseMutation', () => {
  it('atualiza o gasto e invalida o orçamento da viagem', async () => {
    updateExpenseMock.mockResolvedValue(buildExpense({ description: 'Jantar' }));
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useUpdateExpenseMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });
    result.current.mutate({ id: 'expense-1', payload });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateExpenseMock).toHaveBeenCalledWith('test-token', 'trip-1', 'expense-1', payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetQueryKey('trip-1') });
    invalidateSpy.mockRestore();
  });

  it('sem conexão, salva localmente e enfileira a edição', async () => {
    updateExpenseMock.mockRejectedValue(offline);

    const { result } = await renderHook(() => useUpdateExpenseMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });
    result.current.mutate({ id: 'expense-1', payload });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(upsertExpenseToCache).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'expense-1', amount: '120.5', description: 'Jantar' }),
    );
    expect(enqueueMutation).toHaveBeenCalledWith({
      tripId: 'trip-1',
      entityType: 'expense',
      operation: 'update',
      localId: 'expense-1',
      payload,
    });
  });
});

describe('useDeleteExpenseMutation', () => {
  it('exclui o gasto e invalida o orçamento da viagem', async () => {
    deleteExpenseMock.mockResolvedValue(undefined);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useDeleteExpenseMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });
    result.current.mutate('expense-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteExpenseMock).toHaveBeenCalledWith('test-token', 'trip-1', 'expense-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: budgetQueryKey('trip-1') });
    invalidateSpy.mockRestore();
  });

  it('sem conexão, remove do cache e enfileira a exclusão de um gasto já sincronizado', async () => {
    deleteExpenseMock.mockRejectedValue(offline);

    const { result } = await renderHook(() => useDeleteExpenseMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });
    result.current.mutate('expense-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(removeExpenseFromCache).toHaveBeenCalledWith('expense-1');
    expect(enqueueMutation).toHaveBeenCalledWith({
      tripId: 'trip-1',
      entityType: 'expense',
      operation: 'delete',
      localId: 'expense-1',
      payload: null,
    });
  });

  it('sem conexão, descarta um gasto que nunca chegou ao servidor', async () => {
    deleteExpenseMock.mockRejectedValue(offline);

    const { result } = await renderHook(() => useDeleteExpenseMutation('trip-1'), {
      wrapper: createQueryWrapper(),
    });
    result.current.mutate('local-expense-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(discardLocalEntity).toHaveBeenCalledWith('expense', 'local-expense-1');
    expect(enqueueMutation).not.toHaveBeenCalled();
  });
});
