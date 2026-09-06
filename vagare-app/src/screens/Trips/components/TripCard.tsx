import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { formatCurrency, formatDateRange } from '@/utils/format';

export interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const budget = formatCurrency(trip.budget);

  return (
    <View style={styles.card}>
      <Text style={styles.destination}>{trip.destination}</Text>

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
  destination: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
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
});
