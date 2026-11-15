import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, FormError, Input, SelectField } from '@/components';
import { useCreateExpenseMutation } from '@/hooks/useCreateExpenseMutation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useUpdateExpenseMutation } from '@/hooks/useUpdateExpenseMutation';
import { ApiError } from '@/services/api';
import { Expense } from '@/services/expenses';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { amountToDigits, digitsFromCurrencyInput, digitsToAmount, formatAmountFromDigits } from '@/utils/currency';
import { EXPENSE_CATEGORIES } from '@/utils/expenseCategory';

export interface ExpenseFormProps {
  trip: Trip;
  /** Gasto sendo editado; sem ele, o formulário cria um novo. */
  expense?: Expense;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ExpenseForm({ trip, expense, onCancel, onSuccess }: ExpenseFormProps) {
  const isEditMode = !!expense;
  const createMutation = useCreateExpenseMutation(trip.id);
  const updateMutation = useUpdateExpenseMutation(trip.id);
  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  const [description, setDescription] = useState(expense?.description ?? '');
  const [costDigits, setCostDigits] = useState(
    expense ? amountToDigits(Number(expense.amount)) : '',
  );
  const [category, setCategory] = useState<string | null>(expense?.category ?? null);
  const [error, setError] = useState<string | null>(null);
  const { errors, validate, clearError } = useFieldErrors<'description' | 'amount'>();

  const currency = trip.currency;
  const formattedCost = costDigits ? formatAmountFromDigits(costDigits, currency) : '';

  async function handleSubmit() {
    setError(null);

    const amount = costDigits ? digitsToAmount(costDigits) : 0;
    const isValid = validate({
      ...(!description.trim() && { description: 'Descrição é obrigatória' }),
      ...(amount <= 0 && { amount: 'Valor deve ser maior que zero' }),
    });
    if (!isValid) {
      return;
    }

    const payload = { description: description.trim(), amount, currency, category };

    try {
      if (isEditMode && expense) {
        await updateMutation.mutateAsync({ id: expense.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEditMode
            ? 'Não foi possível salvar o gasto.'
            : 'Não foi possível adicionar o gasto.',
      );
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons
          name={isEditMode ? 'create-outline' : 'add'}
          size={20}
          color={colors.text.primary}
        />
        <Text style={styles.title}>{isEditMode ? 'Editar gasto' : 'Novo gasto'}</Text>
      </View>

      <Input
        label="Descrição"
        required
        placeholder="Ex: Jantar no centro"
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          clearError('description');
        }}
        error={errors.description}
        containerStyle={styles.field}
      />

      <View style={styles.row}>
        <Input
          label="Valor"
          required
          placeholder={formatAmountFromDigits('', currency)}
          value={formattedCost}
          onChangeText={(text) => {
            setCostDigits(digitsFromCurrencyInput(text, costDigits, currency));
            clearError('amount');
          }}
          error={errors.amount}
          keyboardType="number-pad"
          selection={{ start: formattedCost.length, end: formattedCost.length }}
          containerStyle={styles.rowItem}
        />
        <Input label="Moeda" value={currency} editable={false} containerStyle={styles.rowItem} />
      </View>

      <SelectField
        label="Categoria"
        value={category}
        options={EXPENSE_CATEGORIES}
        onChange={setCategory}
        containerStyle={styles.field}
      />

      <FormError message={error} />

      <View style={styles.actions}>
        <Button
          title="Cancelar"
          variant="soft"
          onPress={onCancel}
          disabled={isPending}
          style={styles.actionButton}
        />
        <Button
          title={
            isEditMode
              ? isPending
                ? 'Salvando...'
                : 'Salvar'
              : isPending
                ? 'Adicionando...'
                : 'Adicionar'
          }
          onPress={handleSubmit}
          disabled={isPending}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  field: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
