import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ConfirmDialog, FormError } from '@/components';
import { useDeleteInfoMutation } from '@/hooks/useDeleteInfoMutation';
import { ApiError } from '@/services/api';
import { FlightDetails, Info } from '@/services/infos';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { formatDateShort } from '@/utils/format';
import { FlightForm } from './FlightForm';

export interface FlightCardProps {
  info: Info;
  trip: Trip;
}

export function FlightCard({ info, trip }: FlightCardProps) {
  const { mutate: deleteInfo, isPending } = useDeleteInfoMutation(trip.id);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirmDelete() {
    setConfirmVisible(false);
    setError(null);
    deleteInfo(info.id, {
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : 'Não foi possível excluir o voo.');
      },
    });
  }

  if (editing) {
    return (
      <FlightForm
        trip={trip}
        info={info}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  const details = (info.details ?? {}) as Partial<FlightDetails>;
  const routeParts = [details.origin, details.destination].filter(Boolean);
  const detailLine = [
    routeParts.length > 0 ? routeParts.join(' → ') : null,
    info.date ? formatDateShort(info.date) : null,
    details.time || null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="airplane-outline" size={20} color={colors.accent} />
          <Text style={styles.name}>{info.title}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable testID="edit-button" onPress={() => setEditing(true)} hitSlop={12}>
            <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
          </Pressable>
          <Pressable
            testID="delete-button"
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
        </View>
      </View>

      {detailLine ? <Text style={styles.detailLine}>{detailLine}</Text> : null}
      {details.flightNumber ? (
        <Text style={styles.detailLine}>Voo {details.flightNumber}</Text>
      ) : null}

      <FormError message={error} style={styles.errorText} />

      <ConfirmDialog
        visible={confirmVisible}
        title="Excluir voo?"
        message={`${info.title} será removido das informações da viagem. Essa ação não pode ser desfeita.`}
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
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLine: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  errorText: {
    marginTop: spacing.sm,
    marginBottom: 0,
    textAlign: 'left',
  },
});
