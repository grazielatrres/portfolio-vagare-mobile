import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BackButton, Button, FormError, Screen } from '@/components';
import { useTripQuery } from '@/hooks/useTripQuery';
import { ApiError } from '@/services/api';
import { EditTrip } from '@/screens/TripForm';
import { colors, spacing } from '@/theme';

export default function EditTripRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, isError, error, refetch } = useTripQuery(id);

  if (data?.trip) {
    return <EditTrip trip={data.trip} onBack={() => router.back()} onSaved={() => router.back()} />;
  }

  return (
    <Screen style={styles.root}>
      <BackButton onPress={() => router.back()} />
      {isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.state} />
      ) : isError ? (
        <View style={styles.state}>
          <FormError
            message={
              error instanceof ApiError ? error.message : 'Não foi possível carregar a viagem.'
            }
          />
          <Button title="Tentar novamente" variant="soft" onPress={() => refetch()} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  state: {
    marginTop: spacing.xl,
  },
});
