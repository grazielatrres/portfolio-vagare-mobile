import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState, FormError } from '@/components';
import { useActivitiesQuery } from '@/hooks/useActivitiesQuery';
import { ApiError } from '@/services/api';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { groupByDay } from '@/utils/activities';
import { formatDateWithWeekday } from '@/utils/format';
import { ActivityCard } from './ActivityCard';
import { AddActivityForm } from './AddActivityForm';

export interface ItineraryTabProps {
  trip: Trip;
}

export function ItineraryTab({ trip }: ItineraryTabProps) {
  const { data: activities, isPending, isError, error, refetch } = useActivitiesQuery(trip.id);
  const [showForm, setShowForm] = useState(false);

  const dayGroups = activities ? groupByDay(activities, trip.startDate) : [];

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
                : 'Não foi possível carregar o roteiro.'
            }
            style={styles.noMargin}
          />
          <Button title="Tentar novamente" variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {dayGroups.length === 0 ? (
            showForm ? null : (
              <EmptyState
                message="Nenhuma atividade cadastrada ainda. Adicione a primeira ao roteiro."
                style={styles.emptyState}
              />
            )
          ) : (
            dayGroups.map((group) => (
              <View key={group.date} style={styles.dayGroup}>
                <Text style={styles.dayHeader}>{formatDateWithWeekday(group.date)}</Text>
                {group.activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} trip={trip} />
                ))}
              </View>
            ))
          )}

          {showForm ? (
            <AddActivityForm
              trip={trip}
              onCancel={() => setShowForm(false)}
              onSuccess={() => setShowForm(false)}
            />
          ) : (
            <Button
              title="Adicionar ao roteiro"
              variant="outline"
              tone="accent"
              icon={<Ionicons name="add" size={20} color={colors.accent} />}
              onPress={() => setShowForm(true)}
              style={styles.addButton}
            />
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
  emptyState: {
    marginTop: spacing.lg,
  },
  dayGroup: {
    marginBottom: spacing.lg,
  },
  dayHeader: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  addButton: {
    marginTop: spacing.sm,
  },
});
