import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, FormError } from '@/components';
import { useBudgetQuery } from '@/hooks/useBudgetQuery';
import { ApiError } from '@/services/api';
import { BudgetSummary } from '@/services/budget';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { CurrencyCode, formatCurrencyValue } from '@/utils/currency';
import { ExpenseCard } from './ExpenseCard';
import { ExpenseForm } from './ExpenseForm';

export interface BudgetTabProps {
  trip: Trip;
}

export function BudgetTab({ trip }: BudgetTabProps) {
  const { data: queryData, isPending, isError, error, refetch } = useBudgetQuery(trip.id);

  const data = queryData?.summary;
  const currency = trip.currency;

  const [showForm, setShowForm] = useState(false);

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
          <Button title="Tentar novamente" variant="soft" onPress={() => refetch()} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BudgetSummaryCard summary={data} currency={currency} />

          {data.expenses.items.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} trip={trip} />
          ))}

          {showForm ? (
            <ExpenseForm
              trip={trip}
              onCancel={() => setShowForm(false)}
              onSuccess={() => setShowForm(false)}
            />
          ) : (
            <Button
              title="Novo gasto"
              icon={<Ionicons name="add" size={20} color={colors.surface} />}
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
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
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
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  remainingTextNegative: {
    color: colors.danger,
    fontFamily: fonts.medium,
  },
  addButton: {
    marginTop: spacing.sm,
  },
});
