import { notifyBackOnline, notifyOffline } from './connectivity';
import { LOCAL_ID_PREFIX } from './localId';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Status 0 como uma falha de rede (queries caem no cache e mutations vão para
// a fila), mas não significa "sem conexão": a viagem ou o item só ainda não
// existe no servidor. A UI usa a distinção para não mostrar o aviso de offline à toa.
export class UnsyncedEntityError extends ApiError {
  constructor() {
    super(0, 'Este item ainda não foi sincronizado com o servidor.');
    this.name = 'UnsyncedEntityError';
  }
}

// true só para falhas reais de rede (não para itens locais ainda não sincronizados).
export function isNetworkFailure(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0 && !(error instanceof UnsyncedEntityError);
}

type TokenRefresher = (rejectedToken: string) => Promise<string | null>;

let tokenRefresher: TokenRefresher | null = null;

export function setTokenRefresher(refresher: TokenRefresher | null): void {
  tokenRefresher = refresher;
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  token?: string;
  body?: unknown;
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  try {
    return await performRequest<T>(path, options);
  } catch (error) {
    const canRefresh =
      error instanceof ApiError && error.status === 401 && !!options.token && !!tokenRefresher;
    if (!canRefresh) {
      throw error;
    }

    const nextToken = await tokenRefresher!(options.token!);
    if (!nextToken || nextToken === options.token) {
      throw error;
    }

    return performRequest<T>(path, { ...options, token: nextToken });
  }
}

// Viagens e itens criados offline têm id local até a fila sincronizar. Rotas
// com um segmento local-… (/trips/local-…, /activities/local-…) não existem
// no servidor, então são tratadas como "sem conexão": queries caem no cache
// e mutations vão para a fila, que troca pelo id real quando o item sobe.
const LOCAL_ID_SEGMENT = new RegExp(`/${LOCAL_ID_PREFIX}`);

async function performRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  if (LOCAL_ID_SEGMENT.test(path)) {
    throw new UnsyncedEntityError();
  }

  const { token, headers, body, signal, timeoutMs = REQUEST_TIMEOUT_MS, ...rest } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener('abort', () => controller.abort());

  let response: Response;
  let data: unknown;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    data = isJson ? await response.json() : null;
  } catch {
    notifyOffline();
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
  } finally {
    clearTimeout(timeoutId);
  }

  // Chegar ao servidor (independente do status HTTP) já confirma que a rede
  // está de volta — sinal usado pela fila de sincronização offline.
  notifyBackOnline();

  if (!response.ok) {
    const message = (data as { error?: string } | null)?.error ?? 'Erro inesperado. Tente novamente.';
    throw new ApiError(response.status, message);
  }

  return data as T;
}

// Criações levam o id local como Idempotency-Key: se a resposta não chegar (ex.:
// tempo limite) e a fila reenviar com a mesma chave, o servidor devolve o item
// já criado em vez de duplicá-lo.
export function idempotencyHeaders(key?: string): Record<string, string> | undefined {
  return key ? { 'Idempotency-Key': key } : undefined;
}

const PING_TIMEOUT_MS = 5_000;

// Checagem leve de "a rede voltou?" usada pela fila offline. Um sucesso passa
// por performRequest, que já emite notifyBackOnline e dispara a drenagem.
export async function pingServer(): Promise<boolean> {
  try {
    await performRequest('/health', { timeoutMs: PING_TIMEOUT_MS });
    return true;
  } catch {
    return false;
  }
}
