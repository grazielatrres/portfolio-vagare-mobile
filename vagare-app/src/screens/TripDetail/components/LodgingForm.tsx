import { useState } from 'react';
import { View } from 'react-native';

import { DayField, Input } from '@/components';
import { useCreateInfoMutation } from '@/hooks/useCreateInfoMutation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useUpdateInfoMutation } from '@/hooks/useUpdateInfoMutation';
import { ApiError } from '@/services/api';
import { Info, LodgingDetails } from '@/services/infos';
import { Trip } from '@/services/trips';
import { fromISODate, toISODate } from '@/utils/date';
import { formStyles as styles } from './cardStyles';
import { FormCard } from './FormCard';

export interface LodgingFormProps {
  trip: Trip;
  info?: Info;
  onCancel: () => void;
  onSuccess: () => void;
}

export function LodgingForm({ trip, info, onCancel, onSuccess }: LodgingFormProps) {
  const isEditMode = !!info;
  const createMutation = useCreateInfoMutation(trip.id);
  const updateMutation = useUpdateInfoMutation(trip.id);
  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  const tripStart = fromISODate(trip.startDate);
  const tripEnd = fromISODate(trip.endDate);
  const details = (info?.details ?? {}) as Partial<LodgingDetails>;

  const [hotelName, setHotelName] = useState(info?.title ?? '');
  const [address, setAddress] = useState(details.address ?? '');
  const [checkIn, setCheckIn] = useState<Date | null>(
    details.checkIn ? fromISODate(details.checkIn) : null,
  );
  const [checkOut, setCheckOut] = useState<Date | null>(
    details.checkOut ? fromISODate(details.checkOut) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const { errors, validate, clearError } = useFieldErrors<'hotelName' | 'checkOut'>();

  async function handleSubmit() {
    setError(null);

    const isValid = validate({
      ...(!hotelName.trim() && { hotelName: 'Nome do hotel é obrigatório' }),
      ...(checkIn &&
        checkOut &&
        checkOut.getTime() < checkIn.getTime() && {
          checkOut: 'Check-out deve ser igual ou posterior ao check-in',
        }),
    });
    if (!isValid) {
      return;
    }

    const payload = {
      type: 'lodging' as const,
      title: hotelName.trim(),
      details: {
        address: address.trim(),
        checkIn: checkIn ? toISODate(checkIn) : '',
        checkOut: checkOut ? toISODate(checkOut) : '',
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
            ? 'Não foi possível salvar a hospedagem.'
            : 'Não foi possível adicionar a hospedagem.',
      );
    }
  }

  return (
    <FormCard
      title={isEditMode ? 'Editar hospedagem' : 'Adicionar hospedagem'}
      isEditMode={isEditMode}
      isPending={isPending}
      error={error}
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
      <Input
        label="Nome do hotel"
        required
        placeholder="Ex: Grand Hotel"
        value={hotelName}
        onChangeText={(text) => {
          setHotelName(text);
          clearError('hotelName');
        }}
        error={errors.hotelName}
        containerStyle={styles.field}
      />

      <Input
        label="Endereço"
        placeholder="Endereço completo"
        value={address}
        onChangeText={setAddress}
        containerStyle={styles.field}
      />

      <View style={styles.row}>
        <DayField
          label="Check-in"
          value={checkIn}
          onChange={(date) => {
            setCheckIn(date);
            clearError('checkOut');
          }}
          minimumDate={tripStart}
          maximumDate={tripEnd}
          containerStyle={styles.rowItem}
        />
        <DayField
          label="Check-out"
          value={checkOut}
          onChange={(date) => {
            setCheckOut(date);
            clearError('checkOut');
          }}
          error={errors.checkOut}
          minimumDate={checkIn ?? tripStart}
          maximumDate={tripEnd}
          containerStyle={styles.rowItem}
        />
      </View>
    </FormCard>
  );
}
