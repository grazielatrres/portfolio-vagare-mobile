import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ConfirmDialog, FormError } from '@/components';
import { useDeleteActivityMutation } from '@/hooks/useDeleteActivityMutation';
import { ApiError } from '@/services/api';
import { Activity, ActivityPeriod } from '@/services/activities';
import { colors, fonts, spacing } from '@/theme';
import { CurrencyCode, formatCurrencyValue } from '@/utils/currency';

const PERIOD_LABELS: Record<ActivityPeriod, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

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

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="location-outline" size={16} color={colors.accent} />
          <Text style={styles.name}>{activity.name}</Text>
        </View>

        <View style={styles.badges}>
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
      </View>

      {activity.estimatedCost !== null ? (
        <View style={styles.row}>
          <Ionicons name="wallet-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.rowText}>
            {formatCurrencyValue(activity.estimatedCost, currency)}
          </Text>
        </View>
      ) : null}

      {activity.description ? (
        <View style={styles.row}>
          <Ionicons name="document-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.rowText}>{activity.description}</Text>
        </View>
      ) : null}

      <FormError message={error} style={styles.errorText} />

      <Pressable
        onPress={() => setConfirmVisible(true)}
        disabled={isPending}
        hitSlop={12}
        style={styles.deleteButton}
      >
        {isPending ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        )}
      </Pressable>

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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  periodBadge: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  periodBadgeText: {
    fontSize: 12,
    fontFamily: fonts.serif.medium,
    color: colors.text.secondary,
  },
  categoryBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontFamily: fonts.serif.medium,
    color: colors.accent,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  errorText: {
    marginTop: spacing.xs,
    marginBottom: 0,
    textAlign: 'left',
  },
});
