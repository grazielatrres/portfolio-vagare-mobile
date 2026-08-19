import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
}

export const Input = forwardRef<TextInput, InputProps>((
  {
    label,
    placeholder,
    containerStyle,
    labelStyle,
    inputStyle,
    placeholderTextColor = colors.text.placeholder,
    ...textInputProps
  },
  ref,
) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <TextInput
        ref={ref}
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        {...textInputProps}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.serif.medium,
    color: colors.text.primary,
  },
  input: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    backgroundColor: colors.background,
    fontSize: 16,
    fontFamily: fonts.serif.regular,
    color: colors.text.primary,
  },
});
