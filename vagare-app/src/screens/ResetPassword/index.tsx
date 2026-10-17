import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, PasswordInput } from '@/components';
import { ApiError } from '@/services/api';
import { resetPassword } from '@/services/auth';
import { colors, fonts, spacing } from '@/theme';
import { AuthHeader } from '../Home/components/AuthHeader';

export interface ResetPasswordProps {
  token?: string;
  onDone?: () => void;
}

export function ResetPassword({ token, onDone }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!token) {
      setError('Link de redefinição inválido. Solicite um novo.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Preencha os dois campos para continuar.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.root}>
        <AuthHeader
          align="center"
          icon={<Ionicons name="checkmark-circle-outline" size={30} color={colors.surface} />}
          title="Senha redefinida"
          subtitle="Sua senha foi alterada com sucesso. Faça login novamente."
        />
        <Button title="Ir para o login" onPress={onDone} style={styles.field} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuthHeader
        align="center"
        icon={<Ionicons name="lock-closed-outline" size={30} color={colors.surface} />}
        title="Criar nova senha"
        subtitle="Escolha uma nova senha para sua conta."
      />

      <View style={styles.form}>
        <PasswordInput
          label="Nova senha"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={setPassword}
          containerStyle={styles.field}
        />
        <PasswordInput
          label="Confirmar nova senha"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          containerStyle={styles.field}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={isLoading ? 'Salvando...' : 'Salvar nova senha'}
          onPress={handleSubmit}
          disabled={isLoading}
          icon={isLoading ? <ActivityIndicator color={colors.surface} /> : undefined}
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
  form: {
    alignSelf: 'stretch',
    width: '100%',
  },
  field: {
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
