import { captureError } from './monitoring';

// Ponto único de log para falhas não-críticas (ex.: cache local).
// Em dev aparece no console; com o Sentry configurado, vira evento com a tag `context`.
export function logError(context: string, error: unknown): void {
  if (__DEV__) {
    console.error(`[${context}]`, error);
  }
  captureError(context, error);
}
