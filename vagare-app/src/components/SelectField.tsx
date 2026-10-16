import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, spacing } from '@/theme';
import { Input } from './Input';

export interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string | null;
  options: readonly string[];
  placeholder?: string;
  onChange: (value: string) => void;
  containerStyle?: ViewStyle;
}

export function SelectField({
  label,
  required,
  value,
  options,
  placeholder = 'Selecione',
  onChange,
  containerStyle,
}: SelectFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={containerStyle}>
      <Pressable onPress={() => setVisible(true)}>
        <Input
          label={label}
          required={required}
          placeholder={placeholder}
          value={value ?? ''}
          editable={false}
          pointerEvents="none"
          rightElement={<Ionicons name="chevron-down" size={20} color={colors.text.secondary} />}
        />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>{label}</Text>
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const isSelected = option === value;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      onChange(option);
                      setVisible(false);
                    }}
                    style={styles.option}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={18} color={colors.accent} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: spacing.lg,
  },
  sheet: {
    alignSelf: 'stretch',
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  optionsList: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  optionText: {
    fontSize: 16,
    fontFamily: fonts.serif.regular,
    color: colors.text.primary,
  },
  optionTextSelected: {
    fontFamily: fonts.serif.semiBold,
    color: colors.accent,
  },
});
