import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Divider, Input, PasswordInput } from '@/components';
import { colors, fonts, spacing } from '@/theme';
import { AuthHeader } from '../components/AuthHeader';

export interface LoginProps {
  onCreateAccount?: () => void;
}

export function Login({ onCreateAccount }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

        <Pressable style={styles.forgotPassword} hitSlop={8}>
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </Pressable>

        <Button title="Entrar" style={styles.section} />

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
