// Ponto único de log para falhas não-críticas (ex.: cache local).
// RFC 5.7 prevê Sentry; até lá isso cai no console para não perder o sinal.
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}
