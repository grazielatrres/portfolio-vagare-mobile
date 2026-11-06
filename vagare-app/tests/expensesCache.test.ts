import { getDatabase } from '@/services/database';
import {
  clearExpensesCache,
  getCachedExpenses,
  removeExpenseFromCache,
  saveExpensesToCache,
  upsertExpenseToCache,
} from '@/services/expensesCache';

jest.mock('@/services/database', () => ({
  getDatabase: jest.fn(),
}));

const expense = {
  id: 'e1',
  tripId: 't1',
  description: 'Jantar',
  amount: '80',
  currency: 'BRL',
  category: null,
};

describe('expensesCache — nunca propaga erro de SQLite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockRejectedValue(new Error('sqlite indisponível'));
  });

  it('getCachedExpenses resolve [] em falha', async () => {
    await expect(getCachedExpenses('t1')).resolves.toEqual([]);
  });

  it('saveExpensesToCache resolve undefined em falha', async () => {
    await expect(saveExpensesToCache('t1', [expense])).resolves.toBeUndefined();
  });

  it('upsertExpenseToCache resolve undefined em falha', async () => {
    await expect(upsertExpenseToCache(expense)).resolves.toBeUndefined();
  });

  it('removeExpenseFromCache resolve undefined em falha', async () => {
    await expect(removeExpenseFromCache('e1')).resolves.toBeUndefined();
  });

  it('clearExpensesCache resolve undefined em falha', async () => {
    await expect(clearExpensesCache()).resolves.toBeUndefined();
  });
});
