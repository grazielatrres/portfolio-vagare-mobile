import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export type ScreenEdge = 'top' | 'bottom' | 'left' | 'right';

const ALL_EDGES: ScreenEdge[] = ['top', 'bottom', 'left', 'right'];

export interface ScreenProps {
  children: ReactNode;
  /**
   * Bordas protegidas pela safe area. Telas dentro das abas usam `['top']`,
   * porque a tab bar já reserva o espaço do indicador de home.
   */
  edges?: ScreenEdge[];
  /** Estilo do conteúdo; o padding aqui é somado à safe area, não substituído. */
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ALL_EDGES, style }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const safeAreaPadding = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles.root, safeAreaPadding]}>
      <View style={[styles.content, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
