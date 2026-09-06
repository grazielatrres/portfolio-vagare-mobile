import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
import { listTrips, Trip } from '@/services/trips';
import { getCachedTrips, saveTripsToCache } from '@/services/tripsCache';
import { colors, fonts, spacing } from '@/theme';
import { getGreeting } from '@/utils/format';
import { TripCard } from './components/TripCard';

export function Trips() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const data = await listTrips(token);
      setTrips(data);
      await saveTripsToCache(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        const cached = await getCachedTrips();
        if (cached.length > 0) {
          setTrips(cached);
          setIsOffline(true);
        } else {
          setError('Sem conexão e nenhuma viagem salva neste dispositivo ainda.');
        }
      } else {
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar suas viagens.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

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
      />

      <Text style={styles.sectionTitle}>Suas viagens</Text>

      {isOffline ? (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.offlineBannerText}>
            Sem conexão — mostrando as viagens salvas neste dispositivo
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.stateSpacing} />
      ) : error ? (
        <View style={styles.stateSpacing}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Tentar novamente" variant="outline" onPress={loadTrips} />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.stateSpacing}>
          <Text style={styles.emptyText}>
            Você ainda não tem viagens cadastradas. Crie a primeira para começar a planejar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(trip) => trip.id}
          renderItem={({ item }) => <TripCard trip={item} />}
          showsVerticalScrollIndicator={false}
          style={styles.list}
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  list: {
    flex: 1,
  },
  stateSpacing: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.danger,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
