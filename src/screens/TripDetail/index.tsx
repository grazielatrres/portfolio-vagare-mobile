import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  BackButton,
  Button,
  FormError,
  Screen,
  SyncStatusBanner,
} from "@/components";
import { useIsOnline } from "@/hooks/useIsOnline";
import { usePendingMutationsQuery } from "@/hooks/usePendingMutationsQuery";
import { useTripQuery } from "@/hooks/useTripQuery";
import { ApiError } from "@/services/api";
import { colors, fonts, spacing } from "@/theme";
import { formatCurrencyValue } from "@/utils/currency";
import { countTripDays, formatDateFull } from "@/utils/format";
import { BudgetTab } from "./components/BudgetTab";
import { CalendarTab } from "./components/CalendarTab";
import { InfoTab } from "./components/InfoTab";
import { ItineraryTab } from "./components/ItineraryTab";
import { TripTabKey, TripTabs } from "./components/TripTabs";
import { WeatherTab } from "./components/WeatherTab";

export interface TripDetailProps {
  tripId: string;
  onBack?: () => void;
  onEdit?: () => void;
}

export function TripDetail({ tripId, onBack, onEdit }: TripDetailProps) {
  const { data, isPending, isError, error, refetch } = useTripQuery(tripId);
  const trip = data?.trip;
  const isOnline = useIsOnline();
  const { data: pendingMutations } = usePendingMutationsQuery(trip?.id ?? "");
  const [activeTab, setActiveTab] = useState<TripTabKey>("roteiro");

  return (
    <Screen style={styles.root}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
      </View>

      {isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.stateSpacing} />
      ) : isError || !trip ? (
        <View style={styles.stateSpacing}>
          <FormError
            message={
              error instanceof ApiError
                ? error.message
                : "Não foi possível carregar a viagem."
            }
            style={styles.noMargin}
          />
          <Button
            title="Tentar novamente"
            variant="soft"
            onPress={() => refetch()}
          />
        </View>
      ) : (
        <>
          <SyncStatusBanner
            isOffline={!isOnline}
            pendingCount={pendingMutations?.length ?? 0}
            offlineMessage="Sem conexão — mostrando dados salvos neste dispositivo"
          />

          <View style={styles.titleRow}>
            <Text style={styles.destination}>{trip.destination}</Text>
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Editar viagem"
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={colors.accent}
                />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.subtitle}>
            {formatDateFull(trip.startDate)} – {formatDateFull(trip.endDate)} ·{" "}
            {countTripDays(trip.startDate, trip.endDate)} dias
            {trip.budget !== null
              ? ` · ${formatCurrencyValue(trip.budget, trip.currency)}`
              : ""}
          </Text>

          <TripTabs active={activeTab} onChange={setActiveTab} />

          <View style={styles.content}>
            {activeTab === "roteiro" ? (
              <ItineraryTab trip={trip} />
            ) : activeTab === "calendario" ? (
              <CalendarTab trip={trip} />
            ) : activeTab === "clima" ? (
              <WeatherTab trip={trip} />
            ) : activeTab === "orcamento" ? (
              <BudgetTab trip={trip} />
            ) : (
              <InfoTab trip={trip} />
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
  },
  editLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
  stateSpacing: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  noMargin: {
    marginBottom: 0,
  },
  destination: {
    flexShrink: 1,
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  content: {
    flex: 1,
  },
});
