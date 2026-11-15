import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useSyncQueueDrain } from '@/hooks/useSyncQueueDrain';
import {
  initMonitoring,
  navigationIntegration,
  setMonitoringUser,
  wrapRoot,
} from '@/services/monitoring';
import { queryClient } from '@/services/queryClient';

initMonitoring();
SplashScreen.preventAutoHideAsync();

// Associa os eventos do Sentry ao id do usuário logado (sem e-mail ou nome).
function MonitoringUserController() {
  const { user } = useAuth();

  useEffect(() => {
    setMonitoringUser(user?.id ?? null);
  }, [user?.id]);

  return null;
}

function SplashScreenController({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isRestoring } = useAuth();

  useEffect(() => {
    if (fontsLoaded && !isRestoring) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isRestoring]);

  return null;
}

function SyncQueueController() {
  useSyncQueueDrain();
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
        <Stack.Screen name="trip/create" />
        <Stack.Screen name="trip/[id]/index" />
        <Stack.Screen name="trip/[id]/edit" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}

function RootLayout() {
  const [fontsLoaded] = useAppFonts();
  const navigationRef = useNavigationContainerRef();

  // Traces de navegação: tempo de carregamento de cada tela no Sentry.
  useEffect(() => {
    if (navigationRef) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <SplashScreenController fontsLoaded={fontsLoaded} />
              <SyncQueueController />
              <MonitoringUserController />
              <StatusBar style="dark" />
              {fontsLoaded && <RootNavigator />}
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

// Sentry.wrap captura erros de renderização e mede o tempo de abertura do app.
export default wrapRoot(RootLayout);
