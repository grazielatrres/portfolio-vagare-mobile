import { ApiError, apiRequest, setTokenRefresher } from '@/services/api';

jest.mock('@/services/connectivity', () => ({
  notifyBackOnline: jest.fn(),
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
