import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, spacing } from '@/theme';

export interface CardActionsProps {
  /** Nome do item, usado nos rótulos de acessibilidade ("Editar X", "Excluir X"). */
  itemLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  /** Conteúdo exibido antes dos ícones, como badges. */
  children?: ReactNode;
  style?: ViewStyle;
}

/** Ícones de editar e excluir no canto dos cards da viagem. */
export function CardActions({
  itemLabel,
  onEdit,
  onDelete,
  isDeleting,
  children,
  style,
}: CardActionsProps) {
  return (
    <View style={[styles.actions, style]}>
      {children}
      <Pressable
        testID="edit-button"
        onPress={onEdit}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${itemLabel}`}
      >
        <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
      </Pressable>
      <Pressable
        testID="delete-button"
        onPress={onDelete}
        disabled={isDeleting}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${itemLabel}`}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
