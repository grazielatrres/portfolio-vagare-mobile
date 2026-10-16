import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ConfirmDialog, FormError } from '@/components';
import { useDeleteTripMutation } from '@/hooks/useDeleteTripMutation';
import { ApiError } from '@/services/api';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { formatCurrencyValue } from '@/utils/currency';
import { formatDateRange } from '@/utils/format';

export interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const budget = trip.budget !== null ? formatCurrencyValue(trip.budget, trip.currency) : null;
  const { mutate: deleteTrip, isPending } = useDeleteTripMutation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirmDelete() {
    setConfirmVisible(false);
    setError(null);
    deleteTrip(trip.id, {
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : 'Não foi possível excluir a viagem.');
      },
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.destination}>{trip.destination}</Text>
        <Pressable onPress={() => setConfirmVisible(true)} disabled={isPending} hitSlop={12}>
          {isPending ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          )}
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.rowText}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
        </View>
        {budget ? (
          <View style={styles.rowItem}>
            <Ionicons name="wallet-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.rowText}>{budget}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rowItem}>
        <Ionicons name="location-outline" size={16} color={colors.accent} />
        <Text style={styles.plannedText}>Nenhum dia planejado ainda</Text>
      </View>

      <FormError message={error} style={styles.errorText} />

      <ConfirmDialog
        visible={confirmVisible}
        title="Excluir viagem?"
        message={`${trip.destination} será excluída permanentemente, junto com roteiro, gastos e informações associadas. Essa ação não pode ser desfeita.`}
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  destination: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  plannedText: {
    fontSize: 14,
    fontFamily: fonts.serif.medium,
    color: colors.accent,
  },
  errorText: {
    marginTop: spacing.sm,
    marginBottom: 0,
    textAlign: 'left',
  },
});
