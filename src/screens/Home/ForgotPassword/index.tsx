import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BackButton, Button, FormScrollView, Input, Screen } from '@/components';
import { useFieldErrors } from '@/hooks/useFieldErrors';
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
  const { errors, validate, clearError } = useFieldErrors<'email'>();
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!validate({ ...(!email.trim() && { email: 'Informe seu e-mail' }) })) {
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
    <Screen>
      <FormScrollView contentContainerStyle={styles.content}>
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
            onChangeText={(text) => {
              setEmail(text);
              clearError('email');
            }}
            error={errors.email}
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
      </FormScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
    fontFamily: fonts.regular,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.accent,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
