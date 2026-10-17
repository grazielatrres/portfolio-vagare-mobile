import { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme';

import { Input, InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'secureTextEntry' | 'rightElement'>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      secureTextEntry={!visible}
      rightElement={
        <Pressable onPress={() => setVisible((prev) => !prev)} hitSlop={8}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.text.placeholder}
          />
        </Pressable>
      }
    />
  );
}
