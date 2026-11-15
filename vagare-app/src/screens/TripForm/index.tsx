import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  BackButton,
  Button,
  CurrencyPicker,
  DateRangeField,
  DestinationField,
  FormError,
  Input,
  Screen,
} from '@/components';
import { useCreateTripMutation } from '@/hooks/useCreateTripMutation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import { useUpdateTripMutation } from '@/hooks/useUpdateTripMutation';
import { ApiError } from '@/services/api';
import { PlaceSuggestion } from '@/services/geocoding';
import { CreateTripPayload, Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import {
  amountToDigits,
  CurrencyCode,
  digitsFromCurrencyInput,
  digitsToAmount,
  formatAmountFromDigits,
} from '@/utils/currency';
import { fromISODate, toISODate } from '@/utils/date';

type TripField = 'name' | 'destination' | 'period' | 'numberOfPeople';

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseCoordinate(value: string | null): number | null {
  return value !== null && value !== '' ? Number(value) : null;
}

interface TripFormProps {
  /** Viagem sendo editada; sem ela, o formulário cria uma nova. */
  trip?: Trip;
  isPending: boolean;
  onSubmit: (payload: CreateTripPayload) => Promise<unknown>;
  onBack?: () => void;
  onSaved?: () => void;
}

function TripForm({ trip, isPending, onSubmit, onBack, onSaved }: TripFormProps) {
  const isEditMode = !!trip;

  // Na edição, uma viagem já em andamento pode manter a data de início passada.
  const minimumDate = useMemo(() => {
    const today = startOfToday();
    if (!trip) {
      return today;
    }
    const originalStart = fromISODate(trip.startDate);
    return originalStart < today ? originalStart : today;
  }, [trip]);

  const [name, setName] = useState(trip?.name ?? '');
  const [destination, setDestination] = useState(trip?.destination ?? '');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    () => {
      const latitude = parseCoordinate(trip?.latitude ?? null);
      const longitude = parseCoordinate(trip?.longitude ?? null);
      return latitude !== null && longitude !== null ? { latitude, longitude } : null;
    },
  );
  const [startDate, setStartDate] = useState<Date | null>(
    trip ? fromISODate(trip.startDate) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(trip ? fromISODate(trip.endDate) : null);
  const [budgetDigits, setBudgetDigits] = useState(
    trip?.budget ? amountToDigits(Number(trip.budget)) : '',
  );
  const [currency, setCurrency] = useState<CurrencyCode>(trip?.currency ?? 'BRL');
  const [numberOfPeople, setNumberOfPeople] = useState(
    trip?.numberOfPeople ? String(trip.numberOfPeople) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const { errors, validate, clearError } = useFieldErrors<TripField>();

  const formattedBudget = budgetDigits ? formatAmountFromDigits(budgetDigits, currency) : '';

  function handlePeriodChange(nextStartDate: Date, nextEndDate: Date) {
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    clearError('period');
  }

  function handleDestinationChange(text: string) {
    setDestination(text);
    setCoordinates(null);
    clearError('destination');
  }

  function handleSelectPlace(place: PlaceSuggestion) {
    setDestination(place.label);
    setCoordinates({ latitude: place.latitude, longitude: place.longitude });
    clearError('destination');
  }

  async function handleSubmit() {
    setError(null);

    const parsedNumberOfPeople = numberOfPeople.trim() ? Number(numberOfPeople) : null;

    const isValid = validate({
      ...(!name.trim() && { name: 'Nome é obrigatório' }),
      ...(!destination.trim() && { destination: 'Destino é obrigatório' }),
      ...((!startDate || !endDate) && { period: 'Selecione o período da viagem' }),
      ...(startDate &&
        endDate &&
        endDate.getTime() < startDate.getTime() && {
          period: 'A data de término deve ser igual ou posterior à data de início',
        }),
      ...(parsedNumberOfPeople !== null &&
        (!Number.isInteger(parsedNumberOfPeople) || parsedNumberOfPeople < 1) && {
          numberOfPeople: 'Número de pessoas deve ser pelo menos 1',
        }),
    });
    if (!isValid || !startDate || !endDate) {
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        destination: destination.trim(),
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        startDate: toISODate(startDate),
        endDate: toISODate(endDate),
        budget: budgetDigits ? digitsToAmount(budgetDigits) : null,
        currency,
        numberOfPeople: parsedNumberOfPeople,
      });
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEditMode
            ? 'Não foi possível salvar as alterações. Tente novamente.'
            : 'Não foi possível criar a viagem. Tente novamente.',
      );
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackButton onPress={onBack} style={styles.backButton} />

          <Text style={styles.title}>{isEditMode ? 'Editar viagem' : 'Nova viagem'}</Text>
          <Text style={styles.subtitle}>
            {isEditMode ? 'Atualize os dados da sua viagem' : 'Planeje sua próxima aventura'}
          </Text>

          <View style={styles.form}>
            <Input
              label="Nome da viagem"
              required
              placeholder="Ex: Férias de verão"
              value={name}
              onChangeText={(text) => {
                setName(text);
                clearError('name');
              }}
              error={errors.name}
              containerStyle={styles.field}
            />
            <DestinationField
              label="Destino"
              required
              value={destination}
              onChangeText={handleDestinationChange}
              onSelectPlace={handleSelectPlace}
              error={errors.destination}
              containerStyle={styles.field}
            />

            <DateRangeField
              label="Período da viagem"
              required
              startDate={startDate}
              endDate={endDate}
              onChange={handlePeriodChange}
              minimumDate={minimumDate}
              error={errors.period}
              containerStyle={styles.field}
            />

            <CurrencyPicker value={currency} onChange={setCurrency} containerStyle={styles.field} />
            <Input
              label="Orçamento estimado"
              placeholder={formatAmountFromDigits('', currency)}
              value={formattedBudget}
              onChangeText={(text) => setBudgetDigits(digitsFromCurrencyInput(text, budgetDigits, currency))}
              keyboardType="number-pad"
              selection={{ start: formattedBudget.length, end: formattedBudget.length }}
              containerStyle={styles.field}
            />
            <Input
              label="Número de pessoas"
              placeholder="Ex: 2"
              value={numberOfPeople}
              onChangeText={(text) => {
                setNumberOfPeople(text.replace(/\D/g, ''));
                clearError('numberOfPeople');
              }}
              error={errors.numberOfPeople}
              keyboardType="number-pad"
              containerStyle={styles.field}
            />

            <FormError message={error} />

            <Button
              title={
                isEditMode
                  ? isPending
                    ? 'Salvando...'
                    : 'Salvar alterações'
                  : isPending
                    ? 'Criando viagem...'
                    : 'Criar viagem'
              }
              onPress={handleSubmit}
              disabled={isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export interface CreateTripProps {
  onBack?: () => void;
  onCreated?: () => void;
}

export function CreateTrip({ onBack, onCreated }: CreateTripProps) {
  const { mutateAsync, isPending } = useCreateTripMutation();

  return (
    <TripForm isPending={isPending} onSubmit={mutateAsync} onBack={onBack} onSaved={onCreated} />
  );
}

export interface EditTripProps {
  trip: Trip;
  onBack?: () => void;
  onSaved?: () => void;
}

export function EditTrip({ trip, onBack, onSaved }: EditTripProps) {
  const { mutateAsync, isPending } = useUpdateTripMutation(trip);

  return (
    <TripForm
      trip={trip}
      isPending={isPending}
      onSubmit={mutateAsync}
      onBack={onBack}
      onSaved={onSaved}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
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
});
