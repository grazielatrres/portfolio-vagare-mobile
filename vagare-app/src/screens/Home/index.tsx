import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Input } from '@/components/Input';
import { colors, fonts, spacing } from '@/theme';

export function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Bem vindo de volta</Text>
        <Text style={styles.subtitle}>Acesse o Vagare</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label="Senha"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: colors.text.primary,
    fontFamily: fonts.serif.medium,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: fonts.serif.regular,
  },
  form: {
    gap: spacing.md,
  },
});
