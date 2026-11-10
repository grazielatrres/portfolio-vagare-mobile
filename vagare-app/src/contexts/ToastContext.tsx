import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '@/theme';

export interface ToastData {
  title: string;
  message: string;
}

interface ToastContextValue {
  showToast: (toast: ToastData) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DISPLAY_MS = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((next: ToastData) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setToast(next);
    AccessibilityInfo.announceForAccessibility(`${next.title}. ${next.message}`);
    timeoutRef.current = setTimeout(() => setToast(null), DISPLAY_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <View style={[styles.container, { top: insets.top + spacing.md }]} accessibilityRole="alert">
          <Text style={styles.title}>{toast.title}</Text>
          <Text style={styles.message}>{toast.message}</Text>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.text.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.surface,
    marginBottom: 2,
  },
  message: {
    fontSize: 16,
    fontFamily: fonts.serif.regular,
    color: colors.surface,
  },
});
