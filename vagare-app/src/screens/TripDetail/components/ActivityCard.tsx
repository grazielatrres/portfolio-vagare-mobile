import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ConfirmDialog, FormError } from '@/components';
import { useDeleteActivityMutation } from '@/hooks/useDeleteActivityMutation';
import { ApiError } from '@/services/api';
import { Activity } from '@/services/activities';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { PERIOD_LABELS } from '@/utils/activityPeriod';
import { formatCurrencyValue } from '@/utils/currency';
import { formatTime } from '@/utils/date';
import { AddActivityForm } from './AddActivityForm';

type IconName = keyof typeof Ionicons.glyphMap;

export interface ActivityCardProps {
  activity: Activity;
  trip: Trip;
}

export function ActivityCard({ activity, trip }: ActivityCardProps) {
  const { mutate: deleteActivity, isPending } = useDeleteActivityMutation(trip.id);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [editing, setEditing] = useState(false);
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

  if (editing) {
    return (
      <AddActivityForm
        trip={trip}
        activity={activity}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
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
      text: formatCurrencyValue(activity.estimatedCost, trip.currency),
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
          <Pressable onPress={() => setEditing(true)} hitSlop={12}>
            <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
          </Pressable>
          <Pressable onPress={() => setConfirmVisible(true)} disabled={isPending} hitSlop={12}>
            {isPending ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            )}
          </Pressable>
        </View>
      </View>

      {detailRows.length > 0 ? (
        <View style={styles.details}>
          {detailRows.map((item) => (
            <View key={item.icon} style={styles.row}>
              <Ionicons name={item.icon} size={20} color={colors.text.secondary} />
              <Text style={styles.rowText}>{item.text}</Text>
            </View>
          ))}
        </View>
      ) : null}

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
  errorText: {
    marginTop: spacing.sm,
    marginBottom: 0,
    textAlign: 'left',
  },
});
