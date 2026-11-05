import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, FormError } from '@/components';
import { useInfosQuery } from '@/hooks/useInfosQuery';
import { ApiError } from '@/services/api';
import { Info } from '@/services/infos';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { DocumentCard } from './DocumentCard';
import { DocumentForm } from './DocumentForm';
import { FlightCard } from './FlightCard';
import { FlightForm } from './FlightForm';
import { LodgingCard } from './LodgingCard';
import { LodgingForm } from './LodgingForm';

export interface InfoTabProps {
  trip: Trip;
}

function sortByDate(infos: Info[]): Info[] {
  return [...infos].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}

export function InfoTab({ trip }: InfoTabProps) {
  const { data: infos, isPending, isError, error, refetch } = useInfosQuery(trip.id);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [showLodgingForm, setShowLodgingForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);

  const flights = sortByDate((infos ?? []).filter((info) => info.type === 'flight'));
  const lodgings = sortByDate((infos ?? []).filter((info) => info.type === 'lodging'));
  const documents = sortByDate((infos ?? []).filter((info) => info.type === 'document'));

  return (
    <View style={styles.root}>
      {isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.stateSpacing} />
      ) : isError ? (
        <View style={styles.stateSpacing}>
          <FormError
            message={
              error instanceof ApiError
                ? error.message
                : 'Não foi possível carregar as informações da viagem.'
            }
            style={styles.noMargin}
          />
          <Button title="Tentar novamente" variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Informações complementares</Text>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="airplane-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.sectionTitle}>Voos</Text>
            </View>

            {flights.length === 0 && !showFlightForm ? (
              <Text style={styles.emptyText}>Nenhum voo cadastrado ainda.</Text>
            ) : (
              flights.map((info) => <FlightCard key={info.id} info={info} trip={trip} />)
            )}

            {showFlightForm ? (
              <FlightForm
                trip={trip}
                onCancel={() => setShowFlightForm(false)}
                onSuccess={() => setShowFlightForm(false)}
              />
            ) : (
              <Button
                title="Adicionar voo"
                variant="outline"
                tone="accent"
                icon={<Ionicons name="add" size={20} color={colors.accent} />}
                onPress={() => setShowFlightForm(true)}
                style={styles.addButton}
              />
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bed-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.sectionTitle}>Hospedagem</Text>
            </View>

            {lodgings.length === 0 && !showLodgingForm ? (
              <Text style={styles.emptyText}>Nenhuma hospedagem cadastrada ainda.</Text>
            ) : (
              lodgings.map((info) => <LodgingCard key={info.id} info={info} trip={trip} />)
            )}

            {showLodgingForm ? (
              <LodgingForm
                trip={trip}
                onCancel={() => setShowLodgingForm(false)}
                onSuccess={() => setShowLodgingForm(false)}
              />
            ) : (
              <Button
                title="Adicionar hospedagem"
                variant="outline"
                tone="accent"
                icon={<Ionicons name="add" size={20} color={colors.accent} />}
                onPress={() => setShowLodgingForm(true)}
                style={styles.addButton}
              />
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.sectionTitle}>Documentos</Text>
            </View>

            {documents.length === 0 && !showDocumentForm ? (
              <Text style={styles.emptyText}>Nenhum documento cadastrado ainda.</Text>
            ) : (
              documents.map((info) => <DocumentCard key={info.id} info={info} trip={trip} />)
            )}

            {showDocumentForm ? (
              <DocumentForm
                trip={trip}
                onCancel={() => setShowDocumentForm(false)}
                onSuccess={() => setShowDocumentForm(false)}
              />
            ) : (
              <Button
                title="Adicionar documento"
                variant="outline"
                tone="accent"
                icon={<Ionicons name="add" size={20} color={colors.accent} />}
                onPress={() => setShowDocumentForm(true)}
                style={styles.addButton}
              />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  stateSpacing: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  noMargin: {
    marginBottom: 0,
  },
  pageTitle: {
    fontSize: 16,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.serif.bold,
    color: colors.text.secondary,
  },
  emptyText: {
    marginBottom: spacing.md,
    fontSize: 14,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  addButton: {
    marginTop: spacing.xs,
  },
});
