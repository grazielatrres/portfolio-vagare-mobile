import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button, EmptyState, FormError } from "@/components";
import { useActivitiesQuery } from "@/hooks/useActivitiesQuery";
import { ApiError } from "@/services/api";
import { Trip } from "@/services/trips";
import { colors, fonts, spacing } from "@/theme";
import { DayGroup, groupByDay, tripDayDates } from "@/utils/activities";
import { formatDateCompact, formatDateWithWeekday } from "@/utils/format";
import { CalendarActivityRow } from "./CalendarActivityRow";

export interface CalendarTabProps {
  trip: Trip;
}

export function CalendarTab({ trip }: CalendarTabProps) {
  const {
    data: activities,
    isPending,
    isError,
    error,
    refetch,
  } = useActivitiesQuery(trip.id);

  const dates = useMemo(
    () => tripDayDates(trip.startDate, trip.endDate),
    [trip.startDate, trip.endDate],
  );
  const [selectedDate, setSelectedDate] = useState(dates[0]);

  const activitiesByDate = useMemo(() => {
    const groups = activities ? groupByDay(activities, trip.startDate) : [];
    const map = new Map<string, DayGroup>();
    for (const group of groups) {
      map.set(group.date, group);
    }
    return map;
  }, [activities, trip.startDate]);

  const selectedActivities =
    activitiesByDate.get(selectedDate)?.activities ?? [];

  return (
    <View style={styles.root}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.stateSpacing} />
      ) : isError ? (
        <View style={styles.stateSpacing}>
          <FormError
            message={
              error instanceof ApiError
                ? error.message
                : "Não foi possível carregar o calendário."
            }
            style={styles.noMargin}
          />
          <Button
            title="Tentar novamente"
            variant="outline"
            onPress={() => refetch()}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Calendário da viagem</Text>

          <View style={styles.grid}>
            {dates.map((date) => {
              const count = activitiesByDate.get(date)?.activities.length ?? 0;
              const isSelected = date === selectedDate;

              return (
                <Pressable
                  key={date}
                  onPress={() => setSelectedDate(date)}
                  style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                >
                  <Text
                    style={[
                      styles.dayDate,
                      isSelected && styles.dayDateSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {formatDateCompact(date)}
                  </Text>
                  {count > 0 ? (
                    <Text style={styles.dayCount} numberOfLines={1}>
                      {count} {count === 1 ? "atividade" : "atividades"}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.dayHeader}>
            {formatDateWithWeekday(selectedDate)}
          </Text>

          {selectedActivities.length === 0 ? (
            <EmptyState
              message="Nenhuma atividade cadastrada neste dia."
              style={styles.emptyState}
            />
          ) : (
            selectedActivities.map((activity) => (
              <CalendarActivityRow
                key={activity.id}
                activity={activity}
                currency={trip.currency}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  stateSpacing: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  noMargin: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dayCard: {
    width: "22.5%",
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
  },
  dayCardSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  dayDate: {
    fontSize: 15,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  dayDateSelected: {
    color: colors.accent,
  },
  dayCount: {
    fontSize: 11,
    fontFamily: fonts.serif.medium,
    color: colors.accent,
    textAlign: "center",
  },
  dayHeader: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyState: {
    marginTop: spacing.sm,
  },
});
