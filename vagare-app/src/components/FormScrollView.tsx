import { forwardRef } from 'react';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
  KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

import { spacing } from '@/theme';

export type FormScrollViewProps = KeyboardAwareScrollViewProps;
export type FormScrollViewRef = KeyboardAwareScrollViewRef;

/**
 * ScrollView para telas com inputs: ao focar um campo, rola automaticamente até
 * que ele fique `bottomOffset` acima do teclado. Use dentro de `<Screen>`, que
 * já cuida da safe area.
 */
export const FormScrollView = forwardRef<FormScrollViewRef, FormScrollViewProps>(
  function FormScrollView(
    {
      bottomOffset = spacing.lg,
      keyboardShouldPersistTaps = 'handled',
      keyboardDismissMode = 'interactive',
      showsVerticalScrollIndicator = false,
      ...props
    },
    ref,
  ) {
    return (
      <KeyboardAwareScrollView
        ref={ref}
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...props}
      />
    );
  },
);
