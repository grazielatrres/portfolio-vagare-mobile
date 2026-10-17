import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileQuery } from '@/hooks/useProfileQuery';
import { useTripsQuery } from '@/hooks/useTripsQuery';
import { ApiError } from '@/services/api';
import { colors, fonts, spacing } from '@/theme';
import { countDistinctCountries } from '@/utils/format';

export function Profile() {
  const { user, logout, isLoading: isLoggingOut } = useAuth();
  const insets = useSafeAreaInsets();
  const profileQuery = useProfileQuery();
  const tripsQuery = useTripsQuery();

  const isPending = profileQuery.isPending || tripsQuery.isPending;
  const isError = profileQuery.isError || tripsQuery.isError;
  const error = profileQuery.error ?? tripsQuery.error;

  const countryCount = tripsQuery.data
    ? countDistinctCountries(tripsQuery.data.trips.map((trip) => trip.destination))
    : null;

  const name = profileQuery.data?.name ?? user?.name;
  const email = profileQuery.data?.email ?? user?.email;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>Meu Perfil</Text>

      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={28} color={colors.accent} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.email}>{email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estatísticas</Text>

        {isPending ? (
          <ActivityIndicator color={colors.accent} />
        ) : isError ? (
          <Text style={styles.errorText}>
            {error instanceof ApiError ? error.message : 'Não foi possível carregar seu perfil.'}
          </Text>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profileQuery.data?.stats.totalTrips ?? 0}</Text>
              <Text style={styles.statLabel}>
                {profileQuery.data?.stats.totalTrips === 1
                  ? 'Viagem planejada'
                  : 'Viagens planejadas'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{countryCount ?? 0}</Text>
              <View style={styles.statLabelRow}>
                <Ionicons name="location-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.statLabel}>
                  {countryCount === 1 ? 'País' : 'Países'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <Button
        title={isLoggingOut ? 'Saindo...' : 'Sair da conta'}
        variant="outline"
        tone="accent"
        icon={<Ionicons name="log-out-outline" size={18} color={colors.accent} />}
        onPress={logout}
        disabled={isLoggingOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 19,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  email: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontFamily: fonts.serif.bold,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.danger,
    textAlign: 'center',
  },
});
