import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, spacing } from '@/theme';
import { CURRENCIES, CurrencyCode } from '@/utils/currency';

export interface CurrencyPickerProps {
  label?: string;
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  containerStyle?: ViewStyle;
}

export function CurrencyPicker({ label = 'Moeda', value, onChange, containerStyle }: CurrencyPickerProps) {
  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {CURRENCIES.map((currency) => {
          const isSelected = currency.code === value;
          return (
            <Pressable
              key={currency.code}
              onPress={() => onChange(currency.code)}
              style={[styles.pill, isSelected && styles.pillSelected]}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {currency.symbol} {currency.code}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.serif.medium,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 14,
    fontFamily: fonts.serif.medium,
    color: colors.text.primary,
  },
  pillTextSelected: {
    color: colors.surface,
  },
});
