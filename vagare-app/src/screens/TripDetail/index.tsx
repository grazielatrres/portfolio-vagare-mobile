import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, Button, FormError } from '@/components';
import { useTripQuery } from '@/hooks/useTripQuery';
import { ApiError } from '@/services/api';
import { colors, fonts, spacing } from '@/theme';
import { formatCurrencyValue } from '@/utils/currency';
import { countTripDays, formatDateFull } from '@/utils/format';
import { ComingSoon } from './components/ComingSoon';
import { ItineraryTab } from './components/ItineraryTab';
import { TripTabKey, TripTabs } from './components/TripTabs';

export interface TripDetailProps {
  tripId: string;
  onBack?: () => void;
}

export function TripDetail({ tripId, onBack }: TripDetailProps) {
  const insets = useSafeAreaInsets();
  const { data: trip, isPending, isError, error, refetch } = useTripQuery(tripId);
  const [activeTab, setActiveTab] = useState<TripTabKey>('roteiro');

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <BackButton onPress={onBack} style={styles.backButton} />

      {isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.stateSpacing} />
      ) : isError || !trip ? (
        <View style={styles.stateSpacing}>
          <FormError
            message={
              error instanceof ApiError ? error.message : 'Não foi possível carregar a viagem.'
            }
            style={styles.noMargin}
          />
          <Button title="Tentar novamente" variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <>
          <Text style={styles.destination}>{trip.destination}</Text>
          <Text style={styles.subtitle}>
            {formatDateFull(trip.startDate)} – {formatDateFull(trip.endDate)} ·{' '}
            {countTripDays(trip.startDate, trip.endDate)} dias
            {trip.budget !== null ? ` · ${formatCurrencyValue(trip.budget, trip.currency)}` : ''}
          </Text>

          <TripTabs active={activeTab} onChange={setActiveTab} />

          <View style={styles.content}>
            {activeTab === 'roteiro' ? (
              <ItineraryTab trip={trip} />
            ) : activeTab === 'calendario' ? (
              <ComingSoon
                icon="calendar-outline"
                title="Calendário"
                description="Em breve você vai poder ver o roteiro distribuído num calendário mensal."
              />
            ) : activeTab === 'clima' ? (
              <ComingSoon
                icon="cloud-outline"
                title="Clima"
                description="Em breve você vai poder consultar a previsão do tempo para cada dia da viagem."
              />
            ) : activeTab === 'orcamento' ? (
              <ComingSoon
                icon="wallet-outline"
                title="Orçamento"
                description="Em breve você vai poder registrar gastos e acompanhar o saldo da viagem."
              />
            ) : (
              <ComingSoon
                icon="information-circle-outline"
                title="Info"
                description="Em breve você vai poder guardar dados de voo e hospedagem aqui."
              />
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  stateSpacing: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  noMargin: {
    marginBottom: 0,
  },
  destination: {
    fontSize: 26,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  content: {
    flex: 1,
  },
});
