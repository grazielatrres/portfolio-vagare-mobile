import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, FormError } from '@/components';
import { colors, fonts, spacing } from '@/theme';
import { cardStyles } from './cardStyles';

export interface FormCardProps {
  title: string;
  isEditMode: boolean;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: () => void;
  children: ReactNode;
}

/**
 * Moldura dos formulários de criar/editar da viagem: cabeçalho, mensagem de
 * erro e os botões Cancelar e Salvar/Adicionar.
 */
export function FormCard({
  title,
  isEditMode,
  isPending,
  error,
  onCancel,
  onSubmit,
  children,
}: FormCardProps) {
  const submitLabel = isEditMode
    ? isPending
      ? 'Salvando...'
      : 'Salvar'
    : isPending
      ? 'Adicionando...'
      : 'Adicionar';

  return (
    <View style={cardStyles.card}>
      <View style={styles.header}>
        <Ionicons
          name={isEditMode ? 'create-outline' : 'add'}
          size={20}
          color={colors.text.primary}
        />
        <Text style={styles.title}>{title}</Text>
      </View>

      {children}

      <FormError message={error} />

      <View style={styles.actions}>
        <Button
          title="Cancelar"
          variant="soft"
          onPress={onCancel}
          disabled={isPending}
          style={styles.actionButton}
        />
        <Button
          title={submitLabel}
          onPress={onSubmit}
          disabled={isPending}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
