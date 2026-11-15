type Listener = () => void;

const backOnlineListeners = new Set<Listener>();
const statusListeners = new Set<Listener>();

// Sem NetInfo: o estado vem do resultado das requisições ao servidor.
let isOnline = true;

function setOnline(next: boolean): void {
  if (isOnline === next) {
    return;
  }
  isOnline = next;
  statusListeners.forEach((listener) => listener());
}

// Sinal de "a rede voltou", emitido por api.ts a cada round-trip bem-sucedido
// ao servidor. Também dispara a drenagem da fila de sincronização.
export function notifyBackOnline(): void {
  setOnline(true);
  backOnlineListeners.forEach((listener) => listener());
}

export function notifyOffline(): void {
  setOnline(false);
}

export function onBackOnline(listener: Listener): () => void {
  backOnlineListeners.add(listener);
  return () => backOnlineListeners.delete(listener);
}

export function getIsOnline(): boolean {
  return isOnline;
}

export function subscribeConnectivity(listener: Listener): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}
