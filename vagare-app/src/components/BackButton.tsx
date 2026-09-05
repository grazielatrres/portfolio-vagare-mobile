import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, spacing } from '@/theme';

export type BackButtonTone = 'accent' | 'muted';
export type BackButtonAlign = 'left' | 'center';

export interface BackButtonProps {
  label?: string;
  onPress?: () => void;
  tone?: BackButtonTone;
  align?: BackButtonAlign;
  style?: ViewStyle;
}

export function BackButton({
  label = 'Voltar',
  onPress,
  tone = 'accent',
  align = 'left',
  style,
}: BackButtonProps) {
  const color = tone === 'accent' ? colors.accent : colors.text.secondary;

  return (
    <Pressable
      style={[styles.container, align === 'center' && styles.centered, style]}
      onPress={onPress}
      hitSlop={8}
    >
      <Ionicons name="arrow-back" size={20} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
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
  centered: {
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.serif.medium,
  },
});
