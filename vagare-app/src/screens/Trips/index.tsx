import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, EmptyState, FormError, OfflineBanner } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityCountsQuery } from "@/hooks/useActivityCountsQuery";
import { useIsSyncing } from "@/hooks/useIsSyncing";
import { useTripsQuery } from "@/hooks/useTripsQuery";
import { ApiError } from "@/services/api";
import { colors, fonts, spacing } from "@/theme";
import { getGreeting } from "@/utils/format";
import { TripCard } from "./components/TripCard";

export function Trips() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, error, refetch } = useTripsQuery();
  const isSyncing = useIsSyncing();
  const { data: activityCounts, refetch: refetchActivityCounts } = useActivityCountsQuery();
  const [refreshing, setRefreshing] = useState(false);

  // A lista continua montada sob a tela da viagem; recarrega a contagem ao voltar.
  useFocusEffect(
    useCallback(() => {
      refetchActivityCounts();
    }, [refetchActivityCounts]),
  );

  const trips = data?.trips ?? [];
  const isOffline = data?.isOffline ?? false;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchActivityCounts()]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.name}>{user?.name}</Text>
      </View>

      <Button
        title="Criar nova viagem"
        icon={<Ionicons name="add" size={20} color={colors.surface} />}
        style={styles.createButton}
        onPress={() => router.push("/trip/create")}
      />

      <Text style={styles.sectionTitle}>Minhas viagens</Text>

      {isSyncing ? (
        <OfflineBanner tone="syncing" message="Sincronizando alterações feitas offline…" />
      ) : isOffline ? (
        <OfflineBanner message="Sem conexão — mostrando as viagens salvas neste dispositivo" />
      ) : null}

      {isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.stateSpacing} />
      ) : isError ? (
        <View style={styles.stateSpacing}>
          <FormError
            message={
              error instanceof ApiError
                ? error.message
                : "Não foi possível carregar as viagens."
            }
            style={styles.noMargin}
          />
          <Button
            title="Tentar novamente"
            variant="soft"
            onPress={() => refetch()}
          />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.stateSpacing}>
          <EmptyState message="Você ainda não tem viagens cadastradas. Crie a primeira para começar a planejar." />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(trip) => trip.id}
          renderItem={({ item }) => (
            <TripCard trip={item} activityCount={activityCounts?.[item.id] ?? 0} />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 16,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  name: {
    fontSize: 26,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  createButton: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  list: {
    flex: 1,
  },
  stateSpacing: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  noMargin: {
    marginBottom: 0,
  },
});
