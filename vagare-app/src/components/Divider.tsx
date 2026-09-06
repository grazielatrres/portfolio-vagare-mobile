import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  label: {
    marginHorizontal: spacing.sm,
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
});
