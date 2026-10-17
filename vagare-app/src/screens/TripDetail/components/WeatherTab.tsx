import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState, FormError } from '@/components';
import { useWeatherQuery } from '@/hooks/useWeatherQuery';
import { ApiError } from '@/services/api';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { dayNumberInTrip } from '@/utils/format';
import { capitalize, mapWeatherIcon } from '@/utils/weatherIcon';

export interface WeatherTabProps {
  trip: Trip;
}

export function WeatherTab({ trip }: WeatherTabProps) {
  const { data, isPending, isError, error, refetch } = useWeatherQuery(trip.id);
  const [hiddenDates, setHiddenDates] = useState<Set<string>>(new Set());

  const visibleDays = (data ?? []).filter((day) => !hiddenDates.has(day.date));

  function handleRemove(date: string) {
    setHiddenDates((prev) => new Set(prev).add(date));
  }

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
                : 'Não foi possível carregar a previsão do tempo.'
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
          <Text style={styles.sectionTitle}>Previsão do tempo</Text>

          {visibleDays.length === 0 ? (
            <EmptyState
              message="Não há previsão do tempo disponível para os dias desta viagem. A previsão cobre apenas os próximos 5 dias."
              style={styles.emptyState}
            />
          ) : (
            visibleDays.map((day) => (
              <View key={day.date} style={styles.card}>
                <View style={styles.left}>
                  <Ionicons name={mapWeatherIcon(day.icon)} size={28} color={colors.accent} />
                  <View>
                    <Text style={styles.dayLabel}>Dia {dayNumberInTrip(trip.startDate, day.date)}</Text>
                    <Text style={styles.condition}>{capitalize(day.condition)}</Text>
                  </View>
                </View>

                <View style={styles.right}>
                  <View style={styles.tempRow}>
                    <Ionicons name="thermometer-outline" size={16} color={colors.accent} />
                    <Text style={styles.temperature}>{day.temperature}°C</Text>
                  </View>
                  <Pressable onPress={() => handleRemove(day.date)} hitSlop={12}>
                    <Ionicons name="trash-outline" size={20} color={colors.text.secondary} />
                  </Pressable>
                </View>
              </View>
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
  emptyState: {
    marginTop: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  left: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayLabel: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  condition: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  right: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  temperature: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
});
