import { StyleSheet, Text, TextStyle } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export interface FormErrorProps {
  message: string | null;
  style?: TextStyle;
}

export function FormError({ message, style }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return <Text style={[styles.text, style]}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
