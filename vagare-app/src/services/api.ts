import { notifyBackOnline } from './connectivity';

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

// Recebe o token recusado (401) e devolve um token válido para repetir a
// requisição, ou null se a sessão acabou de vez. Lança ApiError(0) se não deu
// para falar com o servidor — a sessão continua, só a requisição falha.
type TokenRefresher = (rejectedToken: string) => Promise<string | null>;

let tokenRefresher: TokenRefresher | null = null;

// O AuthContext registra aqui a renovação via refresh token, para o access
// token expirado ser trocado sem o usuário perceber.
export function setTokenRefresher(refresher: TokenRefresher | null): void {
  tokenRefresher = refresher;
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  token?: string;
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  try {
    return await performRequest<T>(path, options);
  } catch (error) {
    // Só requisições autenticadas: um 401 em /auth/login (senha errada) não
    // tem nada a ver com sessão.
    const canRefresh =
      error instanceof ApiError && error.status === 401 && !!options.token && !!tokenRefresher;
    if (!canRefresh) {
      throw error;
    }

    const nextToken = await tokenRefresher!(options.token!);
    if (!nextToken || nextToken === options.token) {
      throw error;
    }

    // Seguro repetir mesmo POST/DELETE: o 401 vem do authMiddleware, antes de
    // qualquer efeito no servidor.
    return performRequest<T>(path, { ...options, token: nextToken });
  }
}

async function performRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const { token, headers, body, signal, ...rest } = options;

  // O fetch do React Native não tem timeout (no Android espera para sempre):
  // com sinal fraco ou Wi-Fi sem internet, a tela ficaria carregando sem nunca
  // cair no cache offline. Estourar o tempo conta como "sem conexão".
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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
