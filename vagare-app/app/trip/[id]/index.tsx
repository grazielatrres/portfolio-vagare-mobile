import { router, useLocalSearchParams } from 'expo-router';

import { TripDetail } from '@/screens/TripDetail';

export default function TripDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <TripDetail
      tripId={id}
      onBack={() => router.back()}
      onAddActivity={() => router.push(`/trip/${id}/add-activity`)}
    />
  );
}
