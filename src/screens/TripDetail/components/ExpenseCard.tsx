import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ConfirmModal } from '@/components';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useDeleteExpenseMutation } from '@/hooks/useDeleteExpenseMutation';
import { Expense } from '@/services/expenses';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { formatCurrencyValue } from '@/utils/currency';
import { CardActions } from './CardActions';
import { cardStyles } from './cardStyles';
import { ExpenseForm } from './ExpenseForm';

export interface ExpenseCardProps {
  expense: Expense;
  trip: Trip;
}

export function ExpenseCard({ expense, trip }: ExpenseCardProps) {
  const { mutate: deleteExpense, isPending } = useDeleteExpenseMutation(trip.id);
  const confirmDelete = useConfirmDelete(
    deleteExpense,
    expense.id,
    'Não foi possível excluir o gasto',
  );
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ExpenseForm
        trip={trip}
        expense={expense}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  return (
    <View style={[cardStyles.card, styles.card]}>
      <View style={styles.info}>
        <Text style={styles.description}>{expense.description}</Text>
        {expense.category ? <Text style={styles.category}>{expense.category}</Text> : null}
      </View>
      <Text style={styles.amount}>{formatCurrencyValue(expense.amount, trip.currency)}</Text>

      <CardActions
        itemLabel={expense.description}
        onEdit={() => setEditing(true)}
        onDelete={confirmDelete.request}
        isDeleting={isPending}
        style={styles.actions}
      />

      <ConfirmModal
        visible={confirmDelete.visible}
        title="Excluir gasto?"
        message={`${expense.description} será removido do orçamento. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={confirmDelete.confirm}
        onCancel={confirmDelete.cancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  category: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  amount: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  actions: {
    gap: spacing.md,
    marginLeft: spacing.xs,
  },
});
