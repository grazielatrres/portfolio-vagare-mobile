import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ConfirmModal } from "@/components";
import { useToast } from "@/contexts/ToastContext";
import { useDeleteInfoMutation } from "@/hooks/useDeleteInfoMutation";
import { ApiError } from "@/services/api";
import { DocumentDetails, Info } from "@/services/infos";
import { Trip } from "@/services/trips";
import { colors, fonts, spacing } from "@/theme";
import { formatDateShort } from "@/utils/format";
import { DocumentForm } from "./DocumentForm";

export interface DocumentCardProps {
  info: Info;
  trip: Trip;
}

export function DocumentCard({ info, trip }: DocumentCardProps) {
  const { mutate: deleteInfo, isPending } = useDeleteInfoMutation(trip.id);
  const { showToast } = useToast();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  function handleConfirmDelete() {
    setConfirmVisible(false);
    deleteInfo(info.id, {
      onError: (err) => {
        showToast({
          title: "Não foi possível excluir o documento",
          message: err instanceof ApiError ? err.message : "Tente novamente.",
        });
      },
    });
  }

  if (editing) {
    return (
      <DocumentForm
        trip={trip}
        info={info}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  const details = (info.details ?? {}) as Partial<DocumentDetails>;
  const detailLine = [
    details.number ? `Nº ${details.number}` : null,
    info.date ? `Validade: ${formatDateShort(info.date)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color={colors.accent}
          />
          <Text style={styles.name}>{info.title}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => setEditing(true)} hitSlop={12}>
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.text.secondary}
            />
          </Pressable>
          <Pressable
            onPress={() => setConfirmVisible(true)}
            disabled={isPending}
            hitSlop={12}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            )}
          </Pressable>
        </View>
      </View>

      {detailLine ? <Text style={styles.detailLine}>{detailLine}</Text> : null}
      {info.description ? (
        <Text style={styles.detailLine}>{info.description}</Text>
      ) : null}

      <ConfirmModal
        visible={confirmVisible}
        title="Excluir documento?"
        message={`${info.title} será removido das informações da viagem. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  actions: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  detailLine: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
});
