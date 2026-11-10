import { forwardRef, ReactNode, useState } from 'react';
import {
  BlurEvent,
  FocusEvent,
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
  required?: boolean;
  error?: string | null;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  rightElement?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    required,
    error,
    placeholder,
    containerStyle,
    labelStyle,
    inputStyle,
    rightElement,
    placeholderTextColor = colors.text.placeholder,
    onFocus,
    onBlur,
    ...textInputProps
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);

  function handleFocus(event: FocusEvent) {
    setIsFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event: BlurEvent) {
    setIsFocused(false);
    onBlur?.(event);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            rightElement ? styles.inputWithRightElement : null,
            isFocused && !error ? styles.inputFocused : null,
            error ? styles.inputError : null,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          {...textInputProps}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.serif.medium,
    color: colors.text.primary,
  },
  required: {
    color: colors.danger,
  },
  inputWrapper: {
    justifyContent: 'center',
  },
  input: {
    alignSelf: 'stretch',
    height: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    backgroundColor: colors.surface,
    fontSize: 16,
    fontFamily: fonts.serif.regular,
    color: colors.text.primary,
  },
  inputWithRightElement: {
    paddingRight: spacing.xl + spacing.sm,
  },
  inputFocused: {
    borderColor: colors.border.focus,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: 16,
    fontFamily: fonts.serif.regular,
    color: colors.danger,
  },
  rightElement: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
