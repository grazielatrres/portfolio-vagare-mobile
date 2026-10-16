import { router } from 'expo-router';

import { CreateTrip } from '@/screens/CreateTrip';

export default function CreateTripRoute() {
  return <CreateTrip onBack={() => router.back()} onCreated={() => router.back()} />;
}
