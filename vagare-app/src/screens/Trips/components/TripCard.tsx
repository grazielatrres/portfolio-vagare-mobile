import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { useDeleteTripMutation } from "@/hooks/useDeleteTripMutation";
import { useIsSyncing } from "@/hooks/useIsSyncing";
import { ApiError } from "@/services/api";
import { isLocalId } from "@/services/localId";
import { Trip } from "@/services/trips";
import { colors, fonts, spacing } from "@/theme";
import { formatCurrencyValue } from "@/utils/currency";
import { formatDateRange } from "@/utils/format";

export interface TripCardProps {
  trip: Trip;
  activityCount: number;
}

function formatActivityCount(count: number): string {
  if (count === 0) {
    return "Nenhuma atividade planejada ainda";
  }
  return count === 1
    ? "1 atividade planejada"
    : `${count} atividades planejadas`;
}

export function TripCard({ trip, activityCount }: TripCardProps) {
  const budget =
    trip.budget !== null
      ? formatCurrencyValue(trip.budget, trip.currency)
      : null;
  const { mutate: deleteTrip, isPending } = useDeleteTripMutation();
  const { showToast } = useToast();
  const isSyncing = useIsSyncing();
  const isLocalTrip = isLocalId(trip.id);
  const [confirmVisible, setConfirmVisible] = useState(false);

  function handleConfirmDelete() {
    setConfirmVisible(false);
    deleteTrip(trip.id, {
      onError: (err) => {
        showToast({
          title: "Não foi possível excluir a viagem",
          message: err instanceof ApiError ? err.message : "Tente novamente.",
        });
      },
    });
  }

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/trip/${trip.id}`)}
    >
      <View style={styles.header}>
        <Text style={styles.destination}>{trip.destination}</Text>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            setConfirmVisible(true);
          }}
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

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.rowText}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </Text>
        </View>
        {budget ? (
          <View style={styles.rowItem}>
            <Ionicons
              name="wallet-outline"
              size={16}
              color={colors.text.secondary}
            />
            <Text style={styles.rowText}>{budget}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rowItem}>
        <Ionicons name="location-outline" size={16} color={colors.accent} />
        <Text style={styles.plannedText}>
          {formatActivityCount(activityCount)}
        </Text>
      </View>

      {isLocalTrip ? (
        <View style={[styles.rowItem, styles.syncStatus]}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.text.secondary} />
          ) : (
            <Ionicons
              name="cloud-upload-outline"
              size={16}
              color={colors.text.secondary}
            />
          )}
          <Text style={styles.rowText}>
            {isSyncing ? "Sincronizando…" : "Aguardando sincronização"}
          </Text>
        </View>
      ) : null}

      <ConfirmModal
        visible={confirmVisible}
        title="Excluir viagem?"
        message={`${trip.destination} será excluída permanentemente, junto com roteiro, gastos e informações associadas. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </Pressable>
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
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
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
  syncStatus: {
    marginTop: spacing.sm,
  },
});
