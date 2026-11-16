import { StyleSheet } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

/** Estilos comuns aos cards e formulários da tela de detalhes da viagem. */
export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  periodBadge: {
    backgroundColor: colors.background,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
});

export const formStyles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
    marginBottom: spacing.md,
  },
});
