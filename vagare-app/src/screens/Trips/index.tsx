import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
import { listTrips, Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { getGreeting } from '@/utils/format';
import { TripCard } from './components/TripCard';

export function Trips() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await listTrips(token);
      setTrips(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar suas viagens.');
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
