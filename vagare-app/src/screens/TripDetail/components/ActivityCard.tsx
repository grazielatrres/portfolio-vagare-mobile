import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ConfirmDialog, FormError } from '@/components';
import { useDeleteActivityMutation } from '@/hooks/useDeleteActivityMutation';
import { ApiError } from '@/services/api';
import { Activity } from '@/services/activities';
import { colors, fonts, spacing } from '@/theme';
import { PERIOD_LABELS } from '@/utils/activityPeriod';
import { CurrencyCode, formatCurrencyValue } from '@/utils/currency';
import { formatTime } from '@/utils/date';

type IconName = keyof typeof Ionicons.glyphMap;

export interface ActivityCardProps {
  activity: Activity;
  tripId: string;
  currency: CurrencyCode;
}

export function ActivityCard({ activity, tripId, currency }: ActivityCardProps) {
  const { mutate: deleteActivity, isPending } = useDeleteActivityMutation(tripId);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirmDelete() {
    setConfirmVisible(false);
    setError(null);
    deleteActivity(activity.id, {
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : 'Não foi possível excluir a atividade.');
      },
    });
  }

  const detailRows: { icon: IconName; text: string }[] = [];
  if (activity.time) {
    detailRows.push({ icon: 'time-outline', text: formatTime(activity.time) });
  }
  if (activity.location) {
    detailRows.push({ icon: 'location-outline', text: activity.location });
  }
  if (activity.estimatedCost !== null) {
    detailRows.push({
      icon: 'wallet-outline',
      text: formatCurrencyValue(activity.estimatedCost, currency),
    });
  }
  if (activity.description) {
    detailRows.push({ icon: 'document-outline', text: activity.description });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="location-outline" size={20} color={colors.accent} />
          <Text style={styles.name}>{activity.name}</Text>
        </View>

        {activity.period || activity.category ? (
          <View style={styles.actions}>
            {activity.period ? (
              <View style={styles.periodBadge}>
                <Text style={styles.periodBadgeText}>{PERIOD_LABELS[activity.period]}</Text>
              </View>
            ) : null}
            {activity.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{activity.category}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        {detailRows.map((item, index) => {
          const isLast = index === detailRows.length - 1;
          return (
            <View key={item.icon} style={styles.row}>
              <Ionicons name={item.icon} size={20} color={colors.text.secondary} />
              <Text style={styles.rowText}>{item.text}</Text>
              {isLast ? (
                <Pressable
                  onPress={() => setConfirmVisible(true)}
                  disabled={isPending}
                  hitSlop={12}
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  )}
                </Pressable>
              ) : null}
            </View>
          );
        })}

        {detailRows.length === 0 ? (
          <Pressable
            onPress={() => setConfirmVisible(true)}
            disabled={isPending}
            hitSlop={12}
            style={styles.standaloneDeleteButton}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            )}
          </Pressable>
        ) : null}
      </View>

      <FormError message={error} style={styles.errorText} />

      <ConfirmDialog
        visible={confirmVisible}
        title="Excluir atividade?"
        message={`${activity.name} será removida do roteiro. Essa ação não pode ser desfeita.`}
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
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodBadge: {
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
  categoryBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontFamily: fonts.serif.medium,
    color: colors.accent,
  },
  details: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  standaloneDeleteButton: {
    alignSelf: 'flex-end',
  },
  errorText: {
    marginTop: spacing.sm,
    marginBottom: 0,
    textAlign: 'left',
  },
});
