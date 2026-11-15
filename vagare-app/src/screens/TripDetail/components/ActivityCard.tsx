import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ConfirmModal } from "@/components";
import { useConfirmDelete } from "@/hooks/useConfirmDelete";
import { useDeleteActivityMutation } from "@/hooks/useDeleteActivityMutation";
import { Activity } from "@/services/activities";
import { Trip } from "@/services/trips";
import { colors, fonts, spacing } from "@/theme";
import { PERIOD_LABELS } from "@/utils/activityPeriod";
import { formatCurrencyValue } from "@/utils/currency";
import { formatTime } from "@/utils/date";
import { AddActivityForm } from "./AddActivityForm";
import { CardActions } from "./CardActions";
import { cardStyles } from "./cardStyles";

type IconName = keyof typeof Ionicons.glyphMap;

export interface ActivityCardProps {
  activity: Activity;
  trip: Trip;
}

export function ActivityCard({ activity, trip }: ActivityCardProps) {
  const { mutate: deleteActivity, isPending } = useDeleteActivityMutation(
    trip.id,
  );
  const confirmDelete = useConfirmDelete(
    deleteActivity,
    activity.id,
    "Não foi possível excluir a atividade",
  );
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <AddActivityForm
        trip={trip}
        activity={activity}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  const detailRows: { icon: IconName; text: string }[] = [];
  if (activity.time) {
    detailRows.push({ icon: "time-outline", text: formatTime(activity.time) });
  }
  if (activity.location) {
    detailRows.push({ icon: "location-outline", text: activity.location });
  }
  if (activity.estimatedCost !== null) {
    detailRows.push({
      icon: "wallet-outline",
      text: formatCurrencyValue(activity.estimatedCost, trip.currency),
    });
  }
  if (activity.description) {
    detailRows.push({ icon: "document-outline", text: activity.description });
  }

  return (
    <View style={cardStyles.card}>
      <View style={[cardStyles.header, styles.header]}>
        <View style={cardStyles.titleRow}>
          <Ionicons name="location-outline" size={20} color={colors.accent} />
          <Text style={cardStyles.name}>{activity.name}</Text>
        </View>

        <CardActions
          itemLabel={activity.name}
          onEdit={() => setEditing(true)}
          onDelete={confirmDelete.request}
          isDeleting={isPending}
        >
          {activity.period ? (
            <View style={[cardStyles.badge, cardStyles.periodBadge]}>
              <Text style={cardStyles.badgeText}>
                {PERIOD_LABELS[activity.period]}
              </Text>
            </View>
          ) : null}
          {activity.category ? (
            <View style={[cardStyles.badge, styles.categoryBadge]}>
              <Text style={[cardStyles.badgeText, styles.categoryBadgeText]}>
                {activity.category}
              </Text>
            </View>
          ) : null}
        </CardActions>
      </View>

      {detailRows.length > 0 ? (
        <View style={styles.details}>
          {detailRows.map((item) => (
            <View key={item.icon} style={styles.row}>
              <Ionicons
                name={item.icon}
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.rowText}>{item.text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <ConfirmModal
        visible={confirmDelete.visible}
        title="Excluir atividade?"
        message={`${activity.name} será removida do roteiro. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={confirmDelete.confirm}
        onCancel={confirmDelete.cancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.accentSoft,
  },
  categoryBadgeText: {
    color: colors.accent,
  },
  details: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
