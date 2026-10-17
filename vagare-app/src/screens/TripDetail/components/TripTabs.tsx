import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export type TripTabKey = 'roteiro' | 'calendario' | 'clima' | 'orcamento' | 'info';

interface TripTabDefinition {
  key: TripTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TripTabDefinition[] = [
  { key: 'roteiro', label: 'Roteiro', icon: 'location-outline' },
  { key: 'calendario', label: 'Calendário', icon: 'calendar-outline' },
  { key: 'clima', label: 'Clima', icon: 'cloud-outline' },
  { key: 'orcamento', label: 'Orçamento', icon: 'wallet-outline' },
  { key: 'info', label: 'Info', icon: 'information-circle-outline' },
];

export interface TripTabsProps {
  active: TripTabKey;
  onChange: (tab: TripTabKey) => void;
}

export function TripTabs({ active, onChange }: TripTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.root}
      contentContainerStyle={styles.content}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const color = isActive ? colors.accent : colors.text.secondary;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Ionicons name={tab.icon} size={16} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  content: {
    gap: spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.serif.medium,
  },
});
