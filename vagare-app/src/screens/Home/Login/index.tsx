import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Divider, Input, PasswordInput } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/api';
import { colors, fonts, spacing } from '@/theme';
import { AuthHeader } from '../components/AuthHeader';

export interface LoginProps {
  onCreateAccount?: () => void;
  onForgotPassword?: () => void;
}

export function Login({ onCreateAccount, onForgotPassword }: LoginProps) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!email || !password) {
      setError('Informe e-mail e senha para continuar.');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    }
  }

  return (
    <View style={styles.root}>
      <AuthHeader
        align="center"
        icon={<Ionicons name="compass-outline" size={30} color={colors.surface} />}
        title="Bem-vindo de volta"
        subtitle="Acesse o Vagare"
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
        <PasswordInput
          label="Senha"
          placeholder="Sua senha"
          value={password}
          onChangeText={setPassword}
          containerStyle={styles.field}
        />

        <Pressable style={styles.forgotPassword} onPress={onForgotPassword} hitSlop={8}>
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
          title="Entrar com Google"
          variant="outline"
          icon={<Ionicons name="logo-google" size={18} color={colors.text.primary} />}
          style={styles.section}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ainda não tem conta? </Text>
          <Pressable onPress={onCreateAccount} hitSlop={8}>
            <Text style={styles.footerLink}>Criar conta</Text>
          </Pressable>
        </View>
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
  section: {
    marginBottom: spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: fonts.serif.medium,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: fonts.serif.bold,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
});
