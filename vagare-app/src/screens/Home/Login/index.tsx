import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import {
  Button,
  Divider,
  FormError,
  FormScrollView,
  Input,
  PasswordInput,
  Screen,
} from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { ApiError } from '@/services/api';
import { colors, fonts, spacing } from '@/theme';
import { AuthHeader } from '../components/AuthHeader';

export interface LoginProps {
  onCreateAccount?: () => void;
  onForgotPassword?: () => void;
}

export function Login({ onCreateAccount, onForgotPassword }: LoginProps) {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const { signInWithGoogle, isReady: isGoogleReady } = useGoogleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { errors, validate, clearError } = useFieldErrors<'email' | 'password'>();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    const isValid = validate({
      ...(!email.trim() && { email: 'Informe seu e-mail' }),
      ...(!password && { password: 'Informe sua senha' }),
    });
    if (!isValid) {
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const idToken = await signInWithGoogle();
      await loginWithGoogle(idToken);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível entrar com Google. Tente novamente.',
      );
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Screen>
      <FormScrollView contentContainerStyle={styles.content}>
        <Image
          source={require('../../../../assets/images/vagare-logo.svg')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Vagare"
        />

        <AuthHeader
          align="center"
          title="Bem-vindo de volta"
          subtitle="Acesse o Vagare"
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
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError('password');
            }}
            error={errors.password}
            containerStyle={styles.passwordField}
          />

          <Pressable style={styles.forgotPassword} onPress={onForgotPassword} hitSlop={8}>
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </Pressable>

          <FormError message={error} />

          <Button
            title={isLoading ? 'Entrando...' : 'Entrar'}
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.section}
          />

          <View style={styles.section}>
            <Divider label="ou" />
          </View>

          <Button
            title={isGoogleLoading ? 'Entrando...' : 'Entrar com Google'}
            variant="soft"
            icon={
              isGoogleLoading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Ionicons name="logo-google" size={18} color={colors.accent} />
              )
            }
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading || !isGoogleReady}
            style={styles.section}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem conta? </Text>
            <Pressable onPress={onCreateAccount} hitSlop={8}>
              <Text style={styles.footerLink}>Criar conta</Text>
            </Pressable>
          </View>
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
  logo: {
    width: 200,
    aspectRatio: 656 / 128,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  form: {
    alignSelf: 'stretch',
    width: '100%',
  },
  field: {
    marginBottom: spacing.md,
  },
  passwordField: {
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
});
