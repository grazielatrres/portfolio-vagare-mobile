import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useSerifFonts } from '@/hooks/useSerifFonts';
import { queryClient } from '@/services/queryClient';

SplashScreen.preventAutoHideAsync();

function SplashScreenController({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isRestoring } = useAuth();

  useEffect(() => {
    if (fontsLoaded && !isRestoring) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isRestoring]);

  return null;
}

function RootNavigator() {
  const { user, isRestoring } = useAuth();

  if (isRestoring) {
    return null;
  }

  return (
    <Stack key={user ? 'authenticated' : 'guest'} screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useSerifFonts();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SplashScreenController fontsLoaded={fontsLoaded} />
          <StatusBar style="auto" />
          {fontsLoaded && <RootNavigator />}
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
