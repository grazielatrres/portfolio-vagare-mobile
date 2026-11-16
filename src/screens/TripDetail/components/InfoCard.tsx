import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ConfirmModal } from '@/components';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useDeleteInfoMutation } from '@/hooks/useDeleteInfoMutation';
import { Info } from '@/services/infos';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { CardActions } from './CardActions';
import { cardStyles } from './cardStyles';

export interface InfoCardProps {
  info: Info;
  trip: Trip;
  icon: keyof typeof Ionicons.glyphMap;
  /** Linhas exibidas abaixo do título; valores vazios são ignorados. */
  detailLines: (string | null | undefined)[];
  deleteTexts: {
    errorTitle: string;
    confirmTitle: string;
    confirmMessage: string;
  };
  /** Formulário de edição que substitui o card; `close` volta para o card. */
  renderForm: (close: () => void) => ReactNode;
}

/** Card de uma informação complementar da viagem (voo, hospedagem). */
export function InfoCard({
  info,
  trip,
  icon,
  detailLines,
  deleteTexts,
  renderForm,
}: InfoCardProps) {
  const { mutate: deleteInfo, isPending } = useDeleteInfoMutation(trip.id);
  const confirmDelete = useConfirmDelete(deleteInfo, info.id, deleteTexts.errorTitle);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <>{renderForm(() => setEditing(false))}</>;
  }

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={cardStyles.titleRow}>
          <Ionicons name={icon} size={20} color={colors.accent} />
          <Text style={[cardStyles.name, styles.name]}>{info.title}</Text>
        </View>

        <CardActions
          itemLabel={info.title}
          onEdit={() => setEditing(true)}
          onDelete={confirmDelete.request}
          isDeleting={isPending}
        />
      </View>

      {detailLines.filter(Boolean).map((line) => (
        <Text key={line} style={styles.detailLine}>
          {line}
        </Text>
      ))}

      <ConfirmModal
        visible={confirmDelete.visible}
        title={deleteTexts.confirmTitle}
        message={deleteTexts.confirmMessage}
        confirmLabel="Excluir"
        destructive
        onConfirm={confirmDelete.confirm}
        onCancel={confirmDelete.cancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 16,
  },
  detailLine: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
});
