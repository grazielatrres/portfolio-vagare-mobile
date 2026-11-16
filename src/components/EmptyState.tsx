import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { colors, fonts, spacing } from "@/theme";

const DEFAULT_ICON = require("../../assets/images/empty-state.png");

export interface EmptyStateProps {
  message?: string;
  icon?: ImageSourcePropType;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  message = "Não há dados",
  icon = DEFAULT_ICON,
  iconSize = 160,
  style,
}: EmptyStateProps) {
  const asset = Image.resolveAssetSource(icon);
  const aspectRatio =
    asset?.width && asset?.height ? asset.width / asset.height : 1;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={icon}
        style={{ width: iconSize, aspectRatio }}
        resizeMode="contain"
      />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  text: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
