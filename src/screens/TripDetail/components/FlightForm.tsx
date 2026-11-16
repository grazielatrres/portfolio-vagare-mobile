import { useState } from 'react';
import { View } from 'react-native';

import { DayField, Input } from '@/components';
import { useCreateInfoMutation } from '@/hooks/useCreateInfoMutation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useUpdateInfoMutation } from '@/hooks/useUpdateInfoMutation';
import { ApiError } from '@/services/api';
import { FlightDetails, Info } from '@/services/infos';
import { Trip } from '@/services/trips';
import { fromISODate, maskTimeInput, toISODate } from '@/utils/date';
import { formStyles as styles } from './cardStyles';
import { FormCard } from './FormCard';

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
  const { errors, validate, clearError } = useFieldErrors<'airline' | 'time'>();

  async function handleSubmit() {
    setError(null);

    const isValid = validate({
      ...(!airline.trim() && { airline: 'Companhia aérea é obrigatória' }),
      ...(time.trim() &&
        !TIME_PATTERN.test(time.trim()) && { time: 'Horário inválido. Use o formato HH:mm' }),
    });
    if (!isValid) {
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
    <FormCard
      title={isEditMode ? 'Editar voo' : 'Adicionar voo'}
      isEditMode={isEditMode}
      isPending={isPending}
      error={error}
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
      <Input
        label="Companhia aérea"
        required
        placeholder="Ex: Aegean Airlines"
        value={airline}
        onChangeText={(text) => {
          setAirline(text);
          clearError('airline');
        }}
        error={errors.airline}
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
          onChangeText={(text) => {
            setTime(maskTimeInput(text));
            clearError('time');
          }}
          error={errors.time}
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
    </FormCard>
  );
}
