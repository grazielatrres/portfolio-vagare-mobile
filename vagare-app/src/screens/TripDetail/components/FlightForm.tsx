import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button, DayField, FormError, Input } from '@/components';
import { useCreateInfoMutation } from '@/hooks/useCreateInfoMutation';
import { useUpdateInfoMutation } from '@/hooks/useUpdateInfoMutation';
import { ApiError } from '@/services/api';
import { FlightDetails, Info } from '@/services/infos';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { fromISODate, maskTimeInput, toISODate } from '@/utils/date';

export interface FlightFormProps {
  trip: Trip;
  info?: Info;
  onCancel: () => void;
  onSuccess: () => void;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function FlightForm({ trip, info, onCancel, onSuccess }: FlightFormProps) {
  const isEditMode = !!info;
  const createMutation = useCreateInfoMutation(trip.id);
  const updateMutation = useUpdateInfoMutation(trip.id);
  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  const tripStart = fromISODate(trip.startDate);
  const tripEnd = fromISODate(trip.endDate);
  const details = (info?.details ?? {}) as Partial<FlightDetails>;

  const [airline, setAirline] = useState(info?.title ?? '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    info?.date ? fromISODate(info.date) : null,
  );
  const [origin, setOrigin] = useState(details.origin ?? '');
  const [destination, setDestination] = useState(details.destination ?? '');
  const [time, setTime] = useState(details.time ?? '');
  const [flightNumber, setFlightNumber] = useState(details.flightNumber ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!airline.trim()) {
      setError('Companhia aérea é obrigatória');
      return;
    }

    if (time.trim() && !TIME_PATTERN.test(time.trim())) {
      setError('Horário inválido. Use o formato HH:mm');
      return;
    }

    const payload = {
      type: 'flight' as const,
      title: airline.trim(),
      date: selectedDate ? toISODate(selectedDate) : null,
      details: {
        origin: origin.trim(),
        destination: destination.trim(),
        time: time.trim(),
        flightNumber: flightNumber.trim(),
      },
    };

    try {
      if (isEditMode && info) {
        await updateMutation.mutateAsync({ id: info.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEditMode
            ? 'Não foi possível salvar o voo.'
            : 'Não foi possível adicionar o voo.',
      );
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={isEditMode ? 'create-outline' : 'add'} size={20} color={colors.text.primary} />
        <Text style={styles.title}>{isEditMode ? 'Editar voo' : 'Adicionar voo'}</Text>
      </View>

      <Input
        label="Companhia aérea"
        required
        placeholder="Ex: Aegean Airlines"
        value={airline}
        onChangeText={setAirline}
        containerStyle={styles.field}
      />

      <DayField
        label="Data do voo"
        value={selectedDate}
        onChange={setSelectedDate}
        minimumDate={tripStart}
        maximumDate={tripEnd}
        containerStyle={styles.field}
      />

      <View style={styles.row}>
        <Input
          label="Origem"
          placeholder="Ex: GRU"
          value={origin}
          onChangeText={setOrigin}
          containerStyle={styles.rowItem}
        />
        <Input
          label="Destino"
          placeholder="Ex: JTR via ATH"
          value={destination}
          onChangeText={setDestination}
          containerStyle={styles.rowItem}
        />
      </View>

      <View style={styles.row}>
        <Input
          label="Horário"
          placeholder="00:00"
          value={time}
          onChangeText={(text) => setTime(maskTimeInput(text))}
          keyboardType="number-pad"
          maxLength={5}
          containerStyle={styles.rowItem}
        />
        <Input
          label="Número do voo"
          placeholder="Ex: A3 1234"
          value={flightNumber}
          onChangeText={setFlightNumber}
          containerStyle={styles.rowItem}
        />
      </View>

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
    marginBottom: spacing.md,
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
