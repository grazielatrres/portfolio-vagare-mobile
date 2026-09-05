import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackButton, Button, Input, PasswordInput } from '@/components';
import { colors, spacing } from '@/theme';
import { AuthHeader } from '../components/AuthHeader';

export interface SignInProps {
  onBack?: () => void;
}

export function SignIn({ onBack }: SignInProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <View style={styles.root}>
      <BackButton onPress={onBack} style={styles.backButton} />

      <AuthHeader title="Criar conta" subtitle="Crie sua conta no Vagare" />

      <View style={styles.form}>
        <Input
          label="Nome completo"
          placeholder="Seu nome"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          containerStyle={styles.field}
        />
        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.field}
        />
        <PasswordInput
          label="Senha"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={setPassword}
          containerStyle={styles.field}
        />
        <PasswordInput
          label="Confirmar senha"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          containerStyle={styles.field}
        />

        <Button title="Criar Conta" />
      </View>
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
  backButton: {
    marginBottom: spacing.xl,
  },
  form: {
    alignSelf: 'stretch',
    width: '100%',
  },
  field: {
    marginBottom: spacing.md,
  },
});
