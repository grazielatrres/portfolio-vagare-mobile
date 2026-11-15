import {
  ApiError,
  UnsyncedEntityError,
  apiRequest,
  isNetworkFailure,
  pingServer,
  setTokenRefresher,
} from '@/services/api';
import { notifyOffline } from '@/services/connectivity';

jest.mock('@/services/connectivity', () => ({
  notifyBackOnline: jest.fn(),
  notifyOffline: jest.fn(),
}));

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
  };
}

describe('apiRequest - renovação automática do token', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    setTokenRefresher(null);
  });

  function authHeaderOfCall(index: number) {
    return fetchMock.mock.calls[index][1].headers.Authorization;
  }

  it('renova o token e repete a requisição após um 401', async () => {
    const refresher = jest.fn().mockResolvedValue('tok-novo');
    setTokenRefresher(refresher);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: 'Token expirado' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await expect(apiRequest('/trips', { token: 'tok-velho' })).resolves.toEqual({ ok: true });

    expect(refresher).toHaveBeenCalledWith('tok-velho');
    expect(authHeaderOfCall(0)).toBe('Bearer tok-velho');
    expect(authHeaderOfCall(1)).toBe('Bearer tok-novo');
  });

  it('propaga o 401 original quando a sessão não pode ser renovada', async () => {
    setTokenRefresher(jest.fn().mockResolvedValue(null));
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: 'Token expirado' }));

    await expect(apiRequest('/trips', { token: 'tok-velho' })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propaga erro de conexão da renovação para o app seguir no modo offline', async () => {
    setTokenRefresher(jest.fn().mockRejectedValue(new ApiError(0, 'sem conexão')));
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: 'Token expirado' }));

    await expect(apiRequest('/trips', { token: 'tok-velho' })).rejects.toMatchObject({
      status: 0,
    });
  });

  it('não tenta renovar em 401 de requisição sem token (ex.: senha errada no login)', async () => {
    const refresher = jest.fn();
    setTokenRefresher(refresher);
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: 'Credenciais inválidas' }));

    await expect(apiRequest('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 401,
      message: 'Credenciais inválidas',
    });
    expect(refresher).not.toHaveBeenCalled();
  });

  it('trata requisição que não responde como sem conexão (timeout)', async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockImplementationOnce(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      );

      const request = apiRequest('/trips', { token: 'tok' });
      const assertion = expect(request).rejects.toMatchObject({ status: 0 });
      jest.advanceTimersByTime(15_000);
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });

  it('não repete a requisição em outros erros', async () => {
    const refresher = jest.fn();
    setTokenRefresher(refresher);
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { error: 'Não encontrado' }));

    await expect(apiRequest('/trips/x', { token: 'tok' })).rejects.toMatchObject({ status: 404 });
    expect(refresher).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('apiRequest - viagens criadas offline', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('não chama a rede para rotas de viagem com id local', async () => {
    await expect(apiRequest('/trips/local-abc/activities', { token: 'tok' })).rejects.toBeInstanceOf(
      UnsyncedEntityError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('não chama a rede para itens com id local dentro de uma viagem sincronizada', async () => {
    await expect(
      apiRequest('/trips/trip-1/activities/local-abc', { method: 'PUT', token: 'tok' }),
    ).rejects.toBeInstanceOf(UnsyncedEntityError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('isNetworkFailure diferencia falta de rede de viagem não sincronizada', () => {
    expect(isNetworkFailure(new ApiError(0, 'Sem conexão'))).toBe(true);
    expect(isNetworkFailure(new UnsyncedEntityError())).toBe(false);
    expect(isNetworkFailure(new ApiError(500, 'Erro'))).toBe(false);
  });
});

describe('pingServer', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('resolve true quando o servidor responde /health', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { status: 'ok' }));
    await expect(pingServer()).resolves.toBe(true);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/health$/);
  });

  it('resolve false sem lançar quando não há conexão, e marca o app como offline', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(pingServer()).resolves.toBe(false);
    expect(notifyOffline).toHaveBeenCalled();
  });
});
