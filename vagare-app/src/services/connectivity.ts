type Listener = () => void;

const listeners = new Set<Listener>();

// Sinal de "a rede voltou", emitido por api.ts a cada round-trip bem-sucedido
// ao servidor. Alternativa ao NetInfo (não instalado neste projeto) para
// disparar a drenagem da fila de sincronização.
export function notifyBackOnline(): void {
  listeners.forEach((listener) => listener());
}

export function onBackOnline(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
