import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BackButton,
  Button,
  CurrencyPicker,
  DateRangeField,
  DestinationField,
  FormError,
  Input,
} from '@/components';
import { useCreateTripMutation } from '@/hooks/useCreateTripMutation';
import { ApiError } from '@/services/api';
import { PlaceSuggestion } from '@/services/geocoding';
import { colors, fonts, spacing } from '@/theme';
import { toISODate } from '@/utils/date';
import { CurrencyCode, digitsToAmount, formatAmountFromDigits } from '@/utils/currency';

export interface CreateTripProps {
  onBack?: () => void;
  onCreated?: () => void;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function CreateTrip({ onBack, onCreated }: CreateTripProps) {
  const insets = useSafeAreaInsets();
  const { mutateAsync, isPending } = useCreateTripMutation();
  const today = useMemo(() => startOfToday(), []);

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [budgetDigits, setBudgetDigits] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [numberOfPeopleError, setNumberOfPeopleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formattedBudget = budgetDigits ? formatAmountFromDigits(budgetDigits, currency) : '';

  function handlePeriodChange(nextStartDate: Date, nextEndDate: Date) {
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
  }

  function handleDestinationChange(text: string) {
    setDestination(text);
    setCoordinates(null);
  }

  function handleSelectPlace(place: PlaceSuggestion) {
    setDestination(place.label);
    setCoordinates({ latitude: place.latitude, longitude: place.longitude });
  }

  async function handleSubmit() {
    setError(null);
    setNameError(null);
    setDestinationError(null);
    setPeriodError(null);
    setNumberOfPeopleError(null);

    let hasError = false;

    if (!name.trim()) {
      setNameError('Nome é obrigatório');
      hasError = true;
    }

    if (!destination.trim()) {
      setDestinationError('Destino é obrigatório');
      hasError = true;
    }

    if (!startDate || !endDate) {
      setPeriodError('Período da viagem é obrigatório');
      hasError = true;
    } else if (endDate.getTime() < startDate.getTime()) {
      setPeriodError('A data de término deve ser igual ou posterior à data de início');
      hasError = true;
    }

    const parsedBudget = budgetDigits ? digitsToAmount(budgetDigits) : null;

    let parsedNumberOfPeople: number | null = null;
    if (numberOfPeople.trim()) {
      parsedNumberOfPeople = Number(numberOfPeople);
      if (!Number.isInteger(parsedNumberOfPeople) || parsedNumberOfPeople < 1) {
        setNumberOfPeopleError('Número de pessoas deve ser pelo menos 1');
        hasError = true;
      }
    }

    if (hasError || !startDate || !endDate) {
      return;
    }

    try {
      await mutateAsync({
        name: name.trim(),
        destination: destination.trim(),
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        startDate: toISODate(startDate),
        endDate: toISODate(endDate),
        budget: parsedBudget,
        currency,
        numberOfPeople: parsedNumberOfPeople,
      });
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível criar a viagem. Tente novamente.',
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

        <Text style={styles.title}>Nova viagem</Text>
        <Text style={styles.subtitle}>Planeje sua próxima aventura</Text>

        <View style={styles.form}>
          <Input
            label="Nome da viagem"
            required
            placeholder="Ex: Férias de verão"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setNameError(null);
            }}
            error={nameError}
            containerStyle={styles.field}
          />
          <DestinationField
            label="Destino"
            required
            value={destination}
            onChangeText={(text) => {
              handleDestinationChange(text);
              setDestinationError(null);
            }}
            onSelectPlace={handleSelectPlace}
            error={destinationError}
            containerStyle={styles.field}
          />

          <DateRangeField
            label="Período da viagem"
            required
            startDate={startDate}
            endDate={endDate}
            onChange={(nextStart, nextEnd) => {
              handlePeriodChange(nextStart, nextEnd);
              setPeriodError(null);
            }}
            minimumDate={today}
            error={periodError}
            containerStyle={styles.field}
          />

          <CurrencyPicker value={currency} onChange={setCurrency} containerStyle={styles.field} />
          <Input
            label="Orçamento estimado"
            placeholder={formatAmountFromDigits('', currency)}
            value={formattedBudget}
            onChangeText={(text) => setBudgetDigits(text.replace(/\D/g, ''))}
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
              setNumberOfPeopleError(null);
            }}
            error={numberOfPeopleError}
            keyboardType="number-pad"
            containerStyle={styles.field}
          />

          <FormError message={error} />

          <Button
            title={isPending ? 'Criando viagem...' : 'Criar viagem'}
            onPress={handleSubmit}
            disabled={isPending}
          />
        </View>
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
});
