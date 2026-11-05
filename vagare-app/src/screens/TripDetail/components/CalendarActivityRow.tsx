import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Activity } from '@/services/activities';
import { colors, fonts, spacing } from '@/theme';
import { PERIOD_LABELS } from '@/utils/activityPeriod';
import { CurrencyCode, formatCurrencyValue } from '@/utils/currency';

export interface CalendarActivityRowProps {
  activity: Activity;
  currency: CurrencyCode;
}

export function CalendarActivityRow({ activity, currency }: CalendarActivityRowProps) {
  const details = [
    activity.category,
    activity.estimatedCost !== null ? formatCurrencyValue(activity.estimatedCost, currency) : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="location-outline" size={20} color={colors.accent} />
          <Text style={styles.name}>{activity.name}</Text>
        </View>

        {activity.period ? (
          <View style={styles.periodBadge}>
            <Text style={styles.periodBadgeText}>{PERIOD_LABELS[activity.period]}</Text>
          </View>
        ) : null}
      </View>

      {details.length > 0 ? <Text style={styles.details}>{details.join('   ')}</Text> : null}
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
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  periodBadge: {
    flexShrink: 0,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  periodBadgeText: {
    fontSize: 13,
    fontFamily: fonts.serif.medium,
    color: colors.text.secondary,
  },
  details: {
    marginTop: spacing.sm,
    fontSize: 15,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
});
