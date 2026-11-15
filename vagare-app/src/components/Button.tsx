import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

/** Every button is filled: `primary` for the main action, `soft` for secondary ones. */
export type ButtonVariant = 'primary' | 'soft';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: ButtonProps) {
  const isSoft = variant === 'soft';
  const variantStyle = isSoft ? styles.soft : styles.primary;
  const textVariantStyle = isSoft ? styles.softText : styles.primaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, textVariantStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  soft: {
    backgroundColor: colors.accentSoft,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    flexShrink: 1,
  },
  primaryText: {
    fontFamily: fonts.semiBold,
    color: colors.surface,
  },
  softText: {
    fontFamily: fonts.semiBold,
    color: colors.accent,
  },
});
