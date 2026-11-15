import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmModal } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { useDeleteExpenseMutation } from '@/hooks/useDeleteExpenseMutation';
import { ApiError } from '@/services/api';
import { Expense } from '@/services/expenses';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { formatCurrencyValue } from '@/utils/currency';
import { ExpenseForm } from './ExpenseForm';

export interface ExpenseCardProps {
  expense: Expense;
  trip: Trip;
}

export function ExpenseCard({ expense, trip }: ExpenseCardProps) {
  const { mutate: deleteExpense, isPending } = useDeleteExpenseMutation(trip.id);
  const { showToast } = useToast();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  function handleConfirmDelete() {
    setConfirmVisible(false);
    deleteExpense(expense.id, {
      onError: (err) => {
        showToast({
          title: 'Não foi possível excluir o gasto',
          message: err instanceof ApiError ? err.message : 'Tente novamente.',
        });
      },
    });
  }

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
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.description}>{expense.description}</Text>
        {expense.category ? <Text style={styles.category}>{expense.category}</Text> : null}
      </View>
      <Text style={styles.amount}>{formatCurrencyValue(expense.amount, trip.currency)}</Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => setEditing(true)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${expense.description}`}
        >
          <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
        </Pressable>
        <Pressable
          onPress={() => setConfirmVisible(true)}
          disabled={isPending}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Excluir ${expense.description}`}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          )}
        </Pressable>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Excluir gasto?"
        message={`${expense.description} será removido do orçamento. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginLeft: spacing.xs,
  },
});
