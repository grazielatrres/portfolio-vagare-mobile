import { router, useLocalSearchParams } from 'expo-router';

import { AddActivity } from '@/screens/AddActivity';

export default function AddActivityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <AddActivity tripId={id} onBack={() => router.back()} onCreated={() => router.back()} />
  );
}
