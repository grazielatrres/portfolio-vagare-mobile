import { renderHook, waitFor } from '@testing-library/react-native';

import { useBudgetQuery } from '@/hooks/useBudgetQuery';
import { getBudgetSummary } from '@/services/budget';
import { getCachedBudgetSummary } from '@/services/budgetCache';
import { saveExpensesToCache } from '@/services/expensesCache';
import { hasPendingMutationsForTrip } from '@/services/syncQueue';
import { buildBudgetSummary } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/budget');
jest.mock('@/services/expensesCache');
jest.mock('@/services/budgetCache');
jest.mock('@/services/syncQueue', () => ({ hasPendingMutationsForTrip: jest.fn() }));

const getBudgetSummaryMock = getBudgetSummary as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (hasPendingMutationsForTrip as jest.Mock).mockResolvedValue(false);
});

describe('useBudgetQuery', () => {
  it('busca o resumo do orçamento da viagem', async () => {
    const summary = buildBudgetSummary();
    getBudgetSummaryMock.mockResolvedValue(summary);

    const { result } = await renderHook(() => useBudgetQuery('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getBudgetSummaryMock).toHaveBeenCalledWith('test-token', 'trip-1');
    expect(result.current.data).toEqual({ summary, isOffline: false });
    // Sem isso o orçamento offline era recalculado sem nenhuma despesa.
    expect(saveExpensesToCache).toHaveBeenCalledWith('trip-1', summary.expenses.items);
  });

  it('com alterações offline na fila, recalcula o resumo a partir do cache', async () => {
    const fromServer = buildBudgetSummary();
    const local = buildBudgetSummary();
    getBudgetSummaryMock.mockResolvedValue(fromServer);
    (getCachedBudgetSummary as jest.Mock).mockResolvedValue(local);
    (hasPendingMutationsForTrip as jest.Mock).mockResolvedValue(true);

    const { result } = await renderHook(() => useBudgetQuery('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.summary).toBe(local);
    expect(saveExpensesToCache).toHaveBeenCalledWith('trip-1', fromServer.expenses.items);
  });

  it('não dispara a busca quando o id da viagem está vazio', async () => {
    const { result } = await renderHook(() => useBudgetQuery(''), { wrapper: createQueryWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getBudgetSummaryMock).not.toHaveBeenCalled();
  });
});
