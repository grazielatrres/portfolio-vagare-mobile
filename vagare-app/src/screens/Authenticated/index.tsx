import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, spacing } from '@/theme';

export function Authenticated() {
  const { user, logout, isLoading } = useAuth();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Bem-vindo, {user?.name}!</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>
      <Button
        title={isLoading ? 'Saindo...' : 'Sair'}
        variant="outline"
        onPress={logout}
        disabled={isLoading}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  button: {
    alignSelf: 'stretch',
  },
});
