import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BackButton, Button, Input } from '@/components';
import { forgotPassword } from '@/services/auth';
import { ApiError } from '@/services/api';
import { colors, fonts, spacing } from '@/theme';
import { AuthHeader } from '../components/AuthHeader';

export interface ForgotPasswordProps {
  onBack?: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Informe seu email para continuar.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword(email);
      setSuccess(response.message);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível enviar o link. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <AuthHeader
        align="center"
        icon={<Ionicons name="compass-outline" size={30} color={colors.surface} />}
        title="Recuperar senha"
        subtitle="Informe seu email para enviarmos um link de redefinição."
      />

      <View style={styles.form}>
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <Button
          title={isLoading ? 'Enviando...' : 'Enviar link de redefinição'}
          onPress={handleSubmit}
          disabled={isLoading}
          icon={isLoading ? <ActivityIndicator color={colors.surface} /> : undefined}
          style={styles.field}
        />

        <BackButton label="Voltar para o login" onPress={onBack} tone="muted" align="center" />
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
  successText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.accent,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
