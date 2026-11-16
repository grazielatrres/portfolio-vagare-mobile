import * as Sentry from '@sentry/react-native';

// Monitoramento de erros e performance (Sentry), previsto na RFC 5.7.
// Sem EXPO_PUBLIC_SENTRY_DSN (dev local, testes) fica desligado e nada é enviado.

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

let enabled = false;

export function initMonitoring(dsn = process.env.EXPO_PUBLIC_SENTRY_DSN): void {
  if (!dsn) {
    enabled = false;
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'production'),
    // Em dev, todas as navegações viram traces (facilita verificar); nos builds,
    // 20% bastam para ver telas lentas sem estourar a cota.
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // LGPD: não envia IP, e-mail nem corpo de requisições; o usuário vai só pelo id.
    sendDefaultPii: false,
    integrations: [navigationIntegration],
  });
  enabled = true;
}

export function isMonitoringEnabled(): boolean {
  return enabled;
}

export function captureError(context: string, error: unknown): void {
  if (!enabled) return;
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err, { tags: { context } });
}

export function setMonitoringUser(userId: string | null): void {
  if (!enabled) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

export const wrapRoot = Sentry.wrap;
