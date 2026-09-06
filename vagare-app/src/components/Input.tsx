import { forwardRef, ReactNode } from 'react';
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
  rightElement?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    placeholder,
    containerStyle,
    labelStyle,
    inputStyle,
    rightElement,
    placeholderTextColor = colors.text.placeholder,
    ...textInputProps
  },
  ref,
) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={ref}
          style={[styles.input, rightElement ? styles.inputWithRightElement : null, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          {...textInputProps}
        />
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
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
  rightElement: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
