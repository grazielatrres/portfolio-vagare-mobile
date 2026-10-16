import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, Button, FormError, Input } from '@/components';
import { useCreateActivityMutation } from '@/hooks/useCreateActivityMutation';
import { useTripQuery } from '@/hooks/useTripQuery';
import { ApiError } from '@/services/api';
import { ActivityPeriod } from '@/services/activities';
import { colors, fonts, spacing } from '@/theme';
import { digitsToAmount, formatAmountFromDigits } from '@/utils/currency';
import { fromISODate, toISODate } from '@/utils/date';
import { formatDateShort } from '@/utils/format';

export interface AddActivityProps {
  tripId: string;
  onBack?: () => void;
  onCreated?: () => void;
}

const PERIOD_OPTIONS: { value: ActivityPeriod; label: string }[] = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function buildTripDays(startDate: string, endDate: string): { date: string; dayNumber: number }[] {
  const days: { date: string; dayNumber: number }[] = [];
  let cursor = fromISODate(startDate);
  const end = fromISODate(endDate);
  let dayNumber = 1;

  while (cursor.getTime() <= end.getTime()) {
    days.push({ date: toISODate(cursor), dayNumber });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    dayNumber += 1;
  }

  return days;
}

export function AddActivity({ tripId, onBack, onCreated }: AddActivityProps) {
  const insets = useSafeAreaInsets();
  const { data: trip, isPending: isTripPending } = useTripQuery(tripId);
  const { mutateAsync, isPending } = useCreateActivityMutation(tripId);

  const tripDays = useMemo(
    () => (trip ? buildTripDays(trip.startDate, trip.endDate) : []),
    [trip],
  );

  const [name, setName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [period, setPeriod] = useState<ActivityPeriod | null>(null);
  const [category, setCategory] = useState('');
  const [costDigits, setCostDigits] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currency = trip?.currency ?? 'BRL';
  const formattedCost = costDigits ? formatAmountFromDigits(costDigits, currency) : '';
  const activeDate = selectedDate ?? tripDays[0]?.date ?? null;

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!activeDate) {
      setError('Selecione o dia da atividade');
      return;
    }

    if (time.trim() && !TIME_PATTERN.test(time.trim())) {
      setError('Horário inválido. Use o formato HH:mm');
      return;
    }

    try {
      await mutateAsync({
        name: name.trim(),
        date: activeDate,
        time: time.trim() || null,
        period,
        category: category.trim() || null,
        estimatedCost: costDigits ? digitsToAmount(costDigits) : null,
        location: location.trim() || null,
        description: description.trim() || null,
      });
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível adicionar a atividade.',
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton onPress={onBack} style={styles.backButton} />

        <Text style={styles.title}>Adicionar ao roteiro</Text>
        <Text style={styles.subtitle}>Cadastre uma nova atividade para a viagem</Text>

        {isTripPending ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <View style={styles.form}>
            <Input
              label="Nome da atividade"
              placeholder="Ex: Red Beach"
              value={name}
              onChangeText={setName}
              containerStyle={styles.field}
            />

            <Text style={styles.label}>Dia</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dayScroll}
              contentContainerStyle={styles.dayRow}
            >
              {tripDays.map((day) => {
                const isSelected = day.date === activeDate;
                return (
                  <Pressable
                    key={day.date}
                    onPress={() => setSelectedDate(day.date)}
                    style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                  >
                    <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                      Dia {day.dayNumber} · {formatDateShort(day.date)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Input
              label="Horário (opcional)"
              placeholder="Ex: 19:30"
              value={time}
              onChangeText={setTime}
              keyboardType="numbers-and-punctuation"
              containerStyle={styles.field}
            />

            <Text style={styles.label}>Período (opcional)</Text>
            <View style={styles.periodRow}>
              {PERIOD_OPTIONS.map((option) => {
                const isSelected = option.value === period;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setPeriod(isSelected ? null : option.value)}
                    style={[styles.periodPill, isSelected && styles.periodPillSelected]}
                  >
                    <Text
                      style={[
                        styles.periodPillText,
                        isSelected && styles.periodPillTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="Categoria (opcional)"
              placeholder="Ex: Jantar, Praia, Passeio guiado"
              value={category}
              onChangeText={setCategory}
              containerStyle={styles.field}
            />

            <Input
              label="Valor estimado (opcional)"
              placeholder={formatAmountFromDigits('', currency)}
              value={formattedCost}
              onChangeText={(text) => setCostDigits(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              selection={{ start: formattedCost.length, end: formattedCost.length }}
              containerStyle={styles.field}
            />

            <Input
              label="Localização (opcional)"
              placeholder="Ex: Oia, Santorini"
              value={location}
              onChangeText={setLocation}
              containerStyle={styles.field}
            />

            <Input
              label="Descrição (opcional)"
              placeholder="Ex: Jantar com vista do pôr do sol"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              inputStyle={styles.multilineInput}
              containerStyle={styles.field}
            />

            <FormError message={error} />

            <Button
              title={isPending ? 'Adicionando...' : 'Adicionar'}
              onPress={handleSubmit}
              disabled={isPending}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  form: {
    alignSelf: 'stretch',
    width: '100%',
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.sm,
    fontSize: 16,
    fontFamily: fonts.serif.medium,
    color: colors.text.primary,
  },
  dayScroll: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  dayRow: {
    gap: spacing.sm,
  },
  dayChip: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayChipText: {
    fontSize: 14,
    fontFamily: fonts.serif.medium,
    color: colors.text.primary,
  },
  dayChipTextSelected: {
    color: colors.surface,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodPill: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  periodPillText: {
    fontSize: 14,
    fontFamily: fonts.serif.medium,
    color: colors.text.primary,
  },
  periodPillTextSelected: {
    color: colors.surface,
  },
  multilineInput: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
});
