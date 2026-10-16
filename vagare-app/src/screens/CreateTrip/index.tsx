import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, Button, CurrencyPicker, DateRangeField, FormError, Input } from '@/components';
import { useCreateTripMutation } from '@/hooks/useCreateTripMutation';
import { ApiError } from '@/services/api';
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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [budgetDigits, setBudgetDigits] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handlePeriodChange(nextStartDate: Date, nextEndDate: Date) {
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
  }

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!destination.trim()) {
      setError('Destino é obrigatório');
      return;
    }

    if (!startDate) {
      setError('Data de início é obrigatória');
      return;
    }

    if (!endDate) {
      setError('Data de término é obrigatória');
      return;
    }

    if (endDate.getTime() < startDate.getTime()) {
      setError('A data de término deve ser igual ou posterior à data de início');
      return;
    }

    const parsedBudget = budgetDigits ? digitsToAmount(budgetDigits) : null;

    let parsedNumberOfPeople: number | null = null;
    if (numberOfPeople.trim()) {
      parsedNumberOfPeople = Number(numberOfPeople);
      if (!Number.isInteger(parsedNumberOfPeople) || parsedNumberOfPeople < 1) {
        setError('Número de pessoas deve ser pelo menos 1');
        return;
      }
    }

    try {
      await mutateAsync({
        name: name.trim(),
        destination: destination.trim(),
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
            placeholder="Ex: Férias de verão"
            value={name}
            onChangeText={setName}
            containerStyle={styles.field}
          />
          <Input
            label="Destino"
            placeholder="Ex: Santorini, Grécia"
            value={destination}
            onChangeText={setDestination}
            containerStyle={styles.field}
          />

          <DateRangeField
            label="Período da viagem"
            startDate={startDate}
            endDate={endDate}
            onChange={handlePeriodChange}
            minimumDate={today}
            containerStyle={styles.field}
          />

          <CurrencyPicker value={currency} onChange={setCurrency} containerStyle={styles.field} />
          <Input
            label="Orçamento estimado (opcional)"
            placeholder={formatAmountFromDigits('', currency)}
            value={budgetDigits ? formatAmountFromDigits(budgetDigits, currency) : ''}
            onChangeText={(text) => setBudgetDigits(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            containerStyle={styles.field}
          />
          <Input
            label="Número de pessoas (opcional)"
            placeholder="Ex: 2"
            value={numberOfPeople}
            onChangeText={(text) => setNumberOfPeople(text.replace(/\D/g, ''))}
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
