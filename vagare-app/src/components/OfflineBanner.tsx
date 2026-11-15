import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

export type OfflineBannerTone = 'offline' | 'pending' | 'syncing';

export interface OfflineBannerProps {
  message: string;
  tone?: OfflineBannerTone;
  style?: StyleProp<ViewStyle>;
}

const ICONS: Record<Exclude<OfflineBannerTone, 'syncing'>, keyof typeof Ionicons.glyphMap> = {
  offline: 'cloud-offline-outline',
  pending: 'sync-outline',
};

export function OfflineBanner({ message, tone = 'offline', style }: OfflineBannerProps) {
  const isAccent = tone !== 'offline';

  return (
    <View
      style={[styles.banner, isAccent && styles.bannerPending, style]}
      accessibilityLiveRegion={tone === 'syncing' ? 'polite' : undefined}
    >
      {tone === 'syncing' ? (
        <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} />
      ) : (
        <Ionicons
          name={ICONS[tone]}
          size={16}
          color={isAccent ? colors.accent : colors.text.secondary}
        />
      )}
      <Text style={[styles.text, isAccent && styles.textPending]}>{message}</Text>
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
  spinner: {
    width: 16,
    height: 16,
    transform: [{ scale: 0.8 }],
  },
});
