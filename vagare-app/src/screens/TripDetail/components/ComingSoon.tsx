import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export interface ComingSoonProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export function ComingSoon({ icon, title, description }: ComingSoonProps) {
  return (
    <View style={styles.root}>
      <Ionicons name={icon} size={32} color={colors.text.secondary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  description: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
