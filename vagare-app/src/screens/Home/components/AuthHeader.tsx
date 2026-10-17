import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export interface AuthHeaderProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  align?: 'left' | 'center';
}

export function AuthHeader({ title, subtitle, icon, align = 'left' }: AuthHeaderProps) {
  const isCentered = align === 'center';

  return (
    <View style={[styles.container, isCentered && styles.centered]}>
      {icon ? <View style={styles.iconCircle}>{icon}</View> : null}
      <Text style={[styles.title, isCentered && styles.textCenter]}>{title}</Text>
      <Text style={[styles.subtitle, isCentered && styles.textCenter]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  centered: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    color: colors.text.primary,
    fontFamily: fonts.serif.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    fontFamily: fonts.serif.regular,
  },
  textCenter: {
    textAlign: 'center',
  },
});
