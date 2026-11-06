import { Expense } from './expenses';
import { getDatabase } from './database';
import { logError } from './logger';

export async function getCachedExpenses(tripId: string): Promise<Expense[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Expense>('SELECT * FROM expenses WHERE tripId = ?', [tripId]);
  } catch (error) {
    logError('expensesCache.getCachedExpenses', error);
    return [];
  }
}

export async function saveExpensesToCache(tripId: string, expenses: Expense[]): Promise<void> {
  try {
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM expenses WHERE tripId = ?', [tripId]);

      for (const expense of expenses) {
        await db.runAsync(
          `INSERT INTO expenses (id, tripId, description, amount, currency, category)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            expense.id,
            expense.tripId,
            expense.description,
            expense.amount,
            expense.currency,
            expense.category,
          ],
        );
      }
    });
  } catch (error) {
    logError('expensesCache.saveExpensesToCache', error);
  }
}

export async function upsertExpenseToCache(expense: Expense): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO expenses (id, tripId, description, amount, currency, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        expense.id,
        expense.tripId,
        expense.description,
        expense.amount,
        expense.currency,
        expense.category,
      ],
    );
  } catch (error) {
    logError('expensesCache.upsertExpenseToCache', error);
  }
}

export async function removeExpenseFromCache(id: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  } catch (error) {
    logError('expensesCache.removeExpenseFromCache', error);
  }
}

export async function clearExpensesCache(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM expenses');
  } catch (error) {
    logError('expensesCache.clearExpensesCache', error);
  }
}
