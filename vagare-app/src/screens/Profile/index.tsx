import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
import { getMe, UserProfile } from '@/services/users';
import { colors, fonts, spacing } from '@/theme';

export function Profile() {
  const { user, token, logout, isLoading: isLoggingOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getMe(token);
      setProfile(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar seu perfil.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <View style={styles.root}>
      <Text style={styles.name}>{profile?.name ?? user?.name}</Text>
      <Text style={styles.email}>{profile?.email ?? user?.email}</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={styles.statCard} />
      ) : error ? (
        <Text style={[styles.errorText, styles.statCard]}>{error}</Text>
      ) : (
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.stats.totalTrips ?? 0}</Text>
          <Text style={styles.statLabel}>
            {profile?.stats.totalTrips === 1 ? 'viagem planejada' : 'viagens planejadas'}
          </Text>
        </View>
      )}

      <Button
        title={isLoggingOut ? 'Saindo...' : 'Sair'}
        variant="outline"
        onPress={logout}
        disabled={isLoggingOut}
        style={styles.logoutButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  name: {
    fontSize: 24,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 15,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statValue: {
    fontSize: 32,
    fontFamily: fonts.serif.bold,
    color: colors.accent,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.danger,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
});
