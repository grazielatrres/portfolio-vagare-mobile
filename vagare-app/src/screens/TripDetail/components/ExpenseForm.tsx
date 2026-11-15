import { useState } from 'react';
import { View } from 'react-native';

import { Input, SelectField } from '@/components';
import { useCreateExpenseMutation } from '@/hooks/useCreateExpenseMutation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useUpdateExpenseMutation } from '@/hooks/useUpdateExpenseMutation';
import { ApiError } from '@/services/api';
import { Expense } from '@/services/expenses';
import { Trip } from '@/services/trips';
import { amountToDigits, digitsFromCurrencyInput, digitsToAmount, formatAmountFromDigits } from '@/utils/currency';
import { EXPENSE_CATEGORIES } from '@/utils/expenseCategory';
import { formStyles as styles } from './cardStyles';
import { FormCard } from './FormCard';

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
    <FormCard
      title={isEditMode ? 'Editar gasto' : 'Novo gasto'}
      isEditMode={isEditMode}
      isPending={isPending}
      error={error}
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
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
    </FormCard>
  );
}
