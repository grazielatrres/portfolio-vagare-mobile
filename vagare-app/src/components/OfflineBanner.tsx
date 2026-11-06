import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export type OfflineBannerTone = 'offline' | 'pending';

export interface OfflineBannerProps {
  message: string;
  tone?: OfflineBannerTone;
  style?: StyleProp<ViewStyle>;
}

const ICONS: Record<OfflineBannerTone, keyof typeof Ionicons.glyphMap> = {
  offline: 'cloud-offline-outline',
  pending: 'sync-outline',
};

export function OfflineBanner({ message, tone = 'offline', style }: OfflineBannerProps) {
  const isPending = tone === 'pending';

  return (
    <View style={[styles.banner, isPending && styles.bannerPending, style]}>
      <Ionicons
        name={ICONS[tone]}
        size={16}
        color={isPending ? colors.accent : colors.text.secondary}
      />
      <Text style={[styles.text, isPending && styles.textPending]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  bannerPending: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  textPending: {
    color: colors.accent,
  },
});
