import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BackButton, Button, Input } from '@/components';
import { colors, spacing } from '@/theme';
import { AuthHeader } from '../components/AuthHeader';

export interface ForgotPasswordProps {
  onBack?: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');

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

        <Button title="Enviar link de redefinição" style={styles.field} />

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
});
