import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Activity } from '@/services/activities';
import { colors, fonts, spacing } from '@/theme';
import { PERIOD_LABELS } from '@/utils/activityPeriod';
import { CurrencyCode, formatCurrencyValue } from '@/utils/currency';
import { cardStyles } from './cardStyles';

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
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={cardStyles.titleRow}>
          <Ionicons name="location-outline" size={20} color={colors.accent} />
          <Text style={cardStyles.name}>{activity.name}</Text>
        </View>

        {activity.period ? (
          <View style={[cardStyles.badge, cardStyles.periodBadge, styles.badge]}>
            <Text style={cardStyles.badgeText}>{PERIOD_LABELS[activity.period]}</Text>
          </View>
        ) : null}
      </View>

      {details.length > 0 ? <Text style={styles.details}>{details.join('   ')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
  },
  details: {
    marginTop: spacing.sm,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
});
