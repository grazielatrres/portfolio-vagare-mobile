import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button, DayField, FormError, Input } from '@/components';
import { useCreateInfoMutation } from '@/hooks/useCreateInfoMutation';
import { useUpdateInfoMutation } from '@/hooks/useUpdateInfoMutation';
import { ApiError } from '@/services/api';
import { Info, LodgingDetails } from '@/services/infos';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { fromISODate, toISODate } from '@/utils/date';

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
  const [hotelNameError, setHotelNameError] = useState<string | null>(null);
  const [checkOutError, setCheckOutError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setHotelNameError(null);
    setCheckOutError(null);

    let hasError = false;

    if (!hotelName.trim()) {
      setHotelNameError('Nome do hotel é obrigatório');
      hasError = true;
    }

    if (checkIn && checkOut && checkOut.getTime() < checkIn.getTime()) {
      setCheckOutError('Check-out deve ser igual ou posterior ao check-in');
      hasError = true;
    }

    if (hasError) {
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
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={isEditMode ? 'create-outline' : 'add'} size={20} color={colors.text.primary} />
        <Text style={styles.title}>{isEditMode ? 'Editar hospedagem' : 'Adicionar hospedagem'}</Text>
      </View>

      <Input
        label="Nome do hotel"
        required
        placeholder="Ex: Grand Hotel"
        value={hotelName}
        onChangeText={(text) => {
          setHotelName(text);
          setHotelNameError(null);
        }}
        error={hotelNameError}
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
          onChange={setCheckIn}
          minimumDate={tripStart}
          maximumDate={tripEnd}
          containerStyle={styles.rowItem}
        />
        <DayField
          label="Check-out"
          value={checkOut}
          onChange={(date) => {
            setCheckOut(date);
            setCheckOutError(null);
          }}
          error={checkOutError}
          minimumDate={checkIn ?? tripStart}
          maximumDate={tripEnd}
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
