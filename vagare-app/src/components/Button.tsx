import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export type ButtonVariant = 'primary' | 'outline';
export type ButtonTone = 'neutral' | 'accent';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  icon?: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  tone = 'neutral',
  icon,
  disabled,
  style,
}: ButtonProps) {
  const isOutline = variant === 'outline';
  const isAccentTone = tone === 'accent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isOutline ? (isAccentTone ? styles.outlineAccent : styles.outline) : styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          isOutline
            ? isAccentTone
              ? styles.outlineAccentText
              : styles.outlineText
            : styles.primaryText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: 12,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  outlineAccent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
  },
  primaryText: {
    fontFamily: fonts.serif.semiBold,
    color: colors.surface,
  },
  outlineText: {
    fontFamily: fonts.serif.medium,
    color: colors.text.primary,
  },
  outlineAccentText: {
    fontFamily: fonts.serif.semiBold,
    color: colors.accent,
  },
});
