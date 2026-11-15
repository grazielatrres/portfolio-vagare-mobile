import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, spacing } from '@/theme';
import { CURRENCIES, CurrencyCode } from '@/utils/currency';

export interface CurrencyPickerProps {
  label?: string;
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  disabled?: boolean;
  hint?: string;
  containerStyle?: ViewStyle;
}

export function CurrencyPicker({
  label = 'Moeda',
  value,
  onChange,
  disabled = false,
  hint,
  containerStyle,
}: CurrencyPickerProps) {
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
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled }}
              style={[
                styles.pill,
                isSelected && styles.pillSelected,
                disabled && !isSelected && styles.pillDisabled,
              ]}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {currency.symbol} {currency.code}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.medium,
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
  pillDisabled: {
    opacity: 0.4,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  pillText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  pillTextSelected: {
    color: colors.surface,
  },
});
