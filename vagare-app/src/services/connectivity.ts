type Listener = () => void;

const backOnlineListeners = new Set<Listener>();
const statusListeners = new Set<Listener>();

// Último estado de rede observado pelas requisições ao servidor. Começa como
// online; a primeira falha de rede vira offline e o próximo round-trip
// bem-sucedido volta para online. Alternativa ao NetInfo (não instalado).
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

// Emitido por api.ts quando uma requisição não chega ao servidor.
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
