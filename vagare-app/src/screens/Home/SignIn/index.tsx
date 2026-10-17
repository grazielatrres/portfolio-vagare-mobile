import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, Button, FormError, Input, PasswordInput } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
import { colors, spacing } from '@/theme';
import { AuthHeader } from '../components/AuthHeader';

export interface SignInProps {
  onBack?: () => void;
}

export function SignIn({ onBack }: SignInProps) {
  const { register, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    let hasError = false;
    if (!name) {
      setNameError('Informe seu nome completo.');
      hasError = true;
    }
    if (!email) {
      setEmailError('Informe seu email.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Informe uma senha.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('A senha deve ter no mínimo 6 caracteres.');
      hasError = true;
    }
    if (!confirmPassword) {
      setConfirmPasswordError('Confirme sua senha.');
      hasError = true;
    } else if (password && password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem.');
      hasError = true;
    }
    if (hasError) {
      return;
    }

    try {
      await register(name, email, password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível criar a conta. Tente novamente.',
      );
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <BackButton onPress={onBack} style={styles.backButton} />

      <AuthHeader title="Criar conta" subtitle="Crie sua conta no Vagare" />

      <View style={styles.form}>
        <Input
          label="Nome completo"
          placeholder="Seu nome"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError(null);
          }}
          error={nameError}
          autoCapitalize="words"
          containerStyle={styles.field}
        />
        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError(null);
          }}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.field}
        />
        <PasswordInput
          label="Senha"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError(null);
          }}
          error={passwordError}
          containerStyle={styles.field}
        />
        <PasswordInput
          label="Confirmar senha"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setConfirmPasswordError(null);
          }}
          error={confirmPasswordError}
          containerStyle={styles.field}
        />

        <FormError message={error} />

        <Button
          title={isLoading ? 'Criando conta...' : 'Criar Conta'}
          onPress={handleSubmit}
          disabled={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
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
