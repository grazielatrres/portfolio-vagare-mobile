import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, FormError, Input, SelectField } from '@/components';
import { useBudgetQuery } from '@/hooks/useBudgetQuery';
import { useCreateExpenseMutation } from '@/hooks/useCreateExpenseMutation';
import { ApiError } from '@/services/api';
import { BudgetSummary } from '@/services/budget';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import {
  CurrencyCode,
  digitsToAmount,
  formatAmountFromDigits,
  formatCurrencyValue,
} from '@/utils/currency';
import { EXPENSE_CATEGORIES } from '@/utils/expenseCategory';

export interface BudgetTabProps {
  trip: Trip;
}

export function BudgetTab({ trip }: BudgetTabProps) {
  const { data, isPending, isError, error, refetch } = useBudgetQuery(trip.id);
  const { mutateAsync, isPending: isSaving } = useCreateExpenseMutation(trip.id);

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [costDigits, setCostDigits] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const currency = trip.currency;
  const formattedCost = costDigits ? formatAmountFromDigits(costDigits, currency) : '';

  function resetForm() {
    setDescription('');
    setCostDigits('');
    setCategory(null);
    setDescriptionError(null);
    setAmountError(null);
    setFormError(null);
    setShowForm(false);
  }

  async function handleAddExpense() {
    setFormError(null);
    setDescriptionError(null);
    setAmountError(null);

    let hasError = false;

    if (!description.trim()) {
      setDescriptionError('Descrição é obrigatória');
      hasError = true;
    }

    const amount = costDigits ? digitsToAmount(costDigits) : 0;
    if (amount <= 0) {
      setAmountError('Valor deve ser maior que zero');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      await mutateAsync({
        description: description.trim(),
        amount,
        currency,
        category,
      });
      resetForm();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível adicionar o gasto.');
    }
  }

  return (
    <View style={styles.root}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.stateSpacing} />
      ) : isError || !data ? (
        <View style={styles.stateSpacing}>
          <FormError
            message={
              error instanceof ApiError ? error.message : 'Não foi possível carregar o orçamento.'
            }
            style={styles.noMargin}
          />
          <Button title="Tentar novamente" variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BudgetSummaryCard summary={data} currency={currency} />

          {data.expenses.items.map((expense) => (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                {expense.category ? (
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                ) : null}
              </View>
              <Text style={styles.expenseAmount}>
                {formatCurrencyValue(expense.amount, currency)}
              </Text>
            </View>
          ))}

          {showForm ? (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Ionicons name="add" size={20} color={colors.text.primary} />
                <Text style={styles.formTitle}>Novo gasto</Text>
              </View>

              <Input
                label="Descrição"
                required
                placeholder="Ex: Jantar no centro"
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setDescriptionError(null);
                }}
                error={descriptionError}
                containerStyle={styles.field}
              />

              <View style={styles.formRow}>
                <Input
                  label="Valor"
                  required
                  placeholder={formatAmountFromDigits('', currency)}
                  value={formattedCost}
                  onChangeText={(text) => {
                    setCostDigits(text.replace(/\D/g, ''));
                    setAmountError(null);
                  }}
                  error={amountError}
                  keyboardType="number-pad"
                  selection={{ start: formattedCost.length, end: formattedCost.length }}
                  containerStyle={styles.formRowItem}
                />
                <Input
                  label="Moeda"
                  value={currency}
                  editable={false}
                  containerStyle={styles.formRowItem}
                />
              </View>

              <SelectField
                label="Categoria"
                value={category}
                options={EXPENSE_CATEGORIES}
                onChange={setCategory}
                containerStyle={styles.field}
              />

              <FormError message={formError} />

              <View style={styles.formActions}>
                <Button
                  title="Cancelar"
                  variant="soft"
                  onPress={resetForm}
                  disabled={isSaving}
                  style={styles.formButton}
                />
                <Button
                  title={isSaving ? 'Adicionando...' : 'Adicionar'}
                  onPress={handleAddExpense}
                  disabled={isSaving}
                  style={styles.formButton}
                />
              </View>
            </View>
          ) : (
            <Button
              title="Novo gasto"
              variant="outline"
              tone="accent"
              icon={<Ionicons name="add" size={20} color={colors.accent} />}
              onPress={() => setShowForm(true)}
              style={styles.addButton}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

interface BudgetSummaryCardProps {
  summary: BudgetSummary;
  currency: CurrencyCode;
}

function BudgetSummaryCard({ summary, currency }: BudgetSummaryCardProps) {
  const hasBudget = summary.budget !== null;
  const progress = hasBudget && summary.budget! > 0 ? summary.totalSpent / summary.budget! : 0;
  const isOverBudget = summary.remainingBalance !== null && summary.remainingBalance < 0;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Orçamento planejado</Text>
        <Text style={styles.summaryValue}>
          {hasBudget ? formatCurrencyValue(summary.budget as number, currency) : 'Não definido'}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Gastos do roteiro</Text>
        <Text style={styles.summaryValue}>
          {formatCurrencyValue(summary.activitiesCost.total, currency)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Gastos manuais</Text>
        <Text style={styles.summaryValue}>
          {formatCurrencyValue(summary.expenses.total, currency)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrencyValue(summary.totalSpent, currency)}</Text>
      </View>

      {hasBudget ? (
        <>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress, 1) * 100}%` },
                isOverBudget && styles.progressFillOver,
              ]}
            />
          </View>
          <Text style={[styles.remainingText, isOverBudget && styles.remainingTextNegative]}>
            Restante: {formatCurrencyValue(summary.remainingBalance as number, currency)}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  stateSpacing: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  noMargin: {
    marginBottom: 0,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fonts.serif.medium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  progressFillOver: {
    backgroundColor: colors.danger,
  },
  remainingText: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  remainingTextNegative: {
    color: colors.danger,
    fontFamily: fonts.serif.medium,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  expenseInfo: {
    flex: 1,
    minWidth: 0,
  },
  expenseDescription: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  expenseCategory: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  expenseAmount: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  field: {
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formRowItem: {
    flex: 1,
    marginBottom: spacing.md,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formButton: {
    flex: 1,
  },
  addButton: {
    marginTop: spacing.sm,
  },
});
