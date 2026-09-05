import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, spacing } from '@/theme';

export interface BackButtonProps {
  label?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function BackButton({ label = 'Voltar', onPress, style }: BackButtonProps) {
  return (
    <Pressable style={[styles.container, style]} onPress={onPress} hitSlop={8}>
      <Ionicons name="arrow-back" size={20} color={colors.accent} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.serif.medium,
    color: colors.accent,
  },
});
