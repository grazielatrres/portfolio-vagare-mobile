import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, DayField, FormError, Input, SelectField } from '@/components';
import { useCreateActivityMutation } from '@/hooks/useCreateActivityMutation';
import { useUpdateActivityMutation } from '@/hooks/useUpdateActivityMutation';
import { ApiError } from '@/services/api';
import { Activity } from '@/services/activities';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { ACTIVITY_CATEGORIES } from '@/utils/activityCategory';
import { PERIOD_LABELS, derivePeriodFromTime } from '@/utils/activityPeriod';
import { amountToDigits, digitsToAmount, formatAmountFromDigits } from '@/utils/currency';
import { formatTime, fromISODate, maskTimeInput, toISODate } from '@/utils/date';
import { dayNumberInTrip } from '@/utils/format';

export interface AddActivityFormProps {
  trip: Trip;
  activity?: Activity;
  onCancel: () => void;
  onSuccess: () => void;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function AddActivityForm({ trip, activity, onCancel, onSuccess }: AddActivityFormProps) {
  const isEditMode = !!activity;
  const createMutation = useCreateActivityMutation(trip.id);
  const updateMutation = useUpdateActivityMutation(trip.id);
  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  const tripStart = fromISODate(trip.startDate);
  const tripEnd = fromISODate(trip.endDate);

  const [name, setName] = useState(activity?.name ?? '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    activity ? fromISODate(activity.date) : null,
  );
  const [time, setTime] = useState(activity?.time ? formatTime(activity.time) : '');
  const [category, setCategory] = useState<string | null>(activity?.category ?? null);
  const [costDigits, setCostDigits] = useState(
    activity?.estimatedCost ? amountToDigits(Number(activity.estimatedCost)) : '',
  );
  const [location, setLocation] = useState(activity?.location ?? '');
  const [description, setDescription] = useState(activity?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  const currency = trip.currency;
  const formattedCost = costDigits ? formatAmountFromDigits(costDigits, currency) : '';
  const activeDate = selectedDate ?? tripStart;
  const derivedPeriod = time.trim() && TIME_PATTERN.test(time.trim()) ? derivePeriodFromTime(time) : null;

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (time.trim() && !TIME_PATTERN.test(time.trim())) {
      setError('Horário inválido. Use o formato HH:mm');
      return;
    }

    const payload = {
      name: name.trim(),
      date: toISODate(activeDate),
      time: time.trim() || null,
      period: derivedPeriod,
      category,
      estimatedCost: costDigits ? digitsToAmount(costDigits) : null,
      location: location.trim() || null,
      description: description.trim() || null,
    };

    try {
      if (isEditMode && activity) {
        await updateMutation.mutateAsync({ id: activity.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEditMode
            ? 'Não foi possível salvar a atividade.'
            : 'Não foi possível adicionar a atividade.',
      );
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={isEditMode ? 'create-outline' : 'add'} size={20} color={colors.text.primary} />
        <Text style={styles.title}>{isEditMode ? 'Editar atividade' : 'Nova atividade'}</Text>
      </View>

      <Input
        label="Nome da atividade"
        required
        placeholder="Ex: Red Beach"
        value={name}
        onChangeText={setName}
        containerStyle={styles.field}
      />

      <DayField
        label="Dia"
        required
        value={activeDate}
        onChange={setSelectedDate}
        minimumDate={tripStart}
        maximumDate={tripEnd}
        containerStyle={styles.field}
      />
      <Text style={styles.hint}>
        Dia {dayNumberInTrip(trip.startDate, toISODate(activeDate))} da viagem
      </Text>

      <Input
        label="Horário"
        placeholder="00:00"
        value={time}
        onChangeText={(text) => setTime(maskTimeInput(text))}
        keyboardType="number-pad"
        maxLength={5}
        containerStyle={styles.field}
      />
      <Text style={styles.hint}>Formato 24h (ex: 19:30 para 7:30 da noite)</Text>
      {derivedPeriod ? (
        <Text style={styles.hint}>Período: {PERIOD_LABELS[derivedPeriod]}</Text>
      ) : null}

      <SelectField
        label="Categoria"
        value={category}
        options={ACTIVITY_CATEGORIES}
        onChange={setCategory}
        containerStyle={styles.field}
      />

      <Input
        label="Valor estimado"
        placeholder={formatAmountFromDigits('', currency)}
        value={formattedCost}
        onChangeText={(text) => setCostDigits(text.replace(/\D/g, ''))}
        keyboardType="number-pad"
        selection={{ start: formattedCost.length, end: formattedCost.length }}
        containerStyle={styles.field}
      />

      <Input
        label="Localização"
        placeholder="Ex: Oia, Santorini"
        value={location}
        onChangeText={setLocation}
        containerStyle={styles.field}
      />

      <Input
        label="Descrição"
        placeholder="Ex: Jantar com vista do pôr do sol"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        inputStyle={styles.multilineInput}
        containerStyle={styles.field}
      />

      <FormError message={error} />

      <View style={styles.actions}>
        <Button
          title="Cancelar"
          variant="soft"
          onPress={onCancel}
          disabled={isPending}
          style={styles.actionButton}
        />
        <Button
          title={
            isEditMode ? (isPending ? 'Salvando...' : 'Salvar') : isPending ? 'Adicionando...' : 'Adicionar'
          }
          onPress={handleSubmit}
          disabled={isPending}
          style={styles.actionButton}
        />
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  field: {
    marginBottom: spacing.md,
  },
  hint: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    fontSize: 13,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  multilineInput: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
