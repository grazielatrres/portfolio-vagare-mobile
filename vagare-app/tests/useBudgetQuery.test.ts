import { renderHook, waitFor } from '@testing-library/react-native';

import { useBudgetQuery } from '@/hooks/useBudgetQuery';
import { buildBudgetSummary } from './helpers/fixtures';
import { createQueryWrapper } from './helpers/queryWrapper';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must use require, not import, to work with hoisting
jest.mock('@/contexts/AuthContext', () => require('./helpers/mockAuth').authContextMock);
jest.mock('@/services/budget');

import { getBudgetSummary } from '@/services/budget';

const getBudgetSummaryMock = getBudgetSummary as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useBudgetQuery', () => {
  it('busca o resumo do orçamento da viagem', async () => {
    const summary = buildBudgetSummary();
    getBudgetSummaryMock.mockResolvedValue(summary);

    const { result } = renderHook(() => useBudgetQuery('trip-1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getBudgetSummaryMock).toHaveBeenCalledWith('test-token', 'trip-1');
    expect(result.current.data).toEqual(summary);
  });

  it('não dispara a busca quando o id da viagem está vazio', () => {
    const { result } = renderHook(() => useBudgetQuery(''), { wrapper: createQueryWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getBudgetSummaryMock).not.toHaveBeenCalled();
  });
});
