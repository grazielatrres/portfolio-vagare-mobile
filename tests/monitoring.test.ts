import * as Sentry from '@sentry/react-native';

import { logError } from '@/services/logger';
import {
  captureError,
  initMonitoring,
  isMonitoringEnabled,
  setMonitoringUser,
} from '@/services/monitoring';

const sentry = Sentry as unknown as {
  init: jest.Mock;
  captureException: jest.Mock;
  setUser: jest.Mock;
};

const DSN = 'https://key@o0.ingest.sentry.io/1';

beforeEach(() => {
  jest.clearAllMocks();
  initMonitoring('');
});

describe('monitoring', () => {
  it('fica desligado sem DSN e não envia nada', () => {
    initMonitoring('');

    captureError('cache', new Error('falhou'));
    setMonitoringUser('user-1');

    expect(isMonitoringEnabled()).toBe(false);
    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.setUser).not.toHaveBeenCalled();
  });

  it('inicializa o Sentry sem dados pessoais quando há DSN', () => {
    initMonitoring(DSN);

    expect(isMonitoringEnabled()).toBe(true);
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: DSN, sendDefaultPii: false }),
    );
  });

  describe('tracesSampleRate', () => {
    const globals = globalThis as unknown as { __DEV__: boolean };
    const originalDev = globals.__DEV__;

    afterEach(() => {
      globals.__DEV__ = originalDev;
    });

    it('amostra todas as navegações em dev', () => {
      globals.__DEV__ = true;

      initMonitoring(DSN);

      expect(sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ tracesSampleRate: 1.0 }),
      );
    });

    it('amostra 20% das navegações nos builds', () => {
      globals.__DEV__ = false;

      initMonitoring(DSN);

      expect(sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ tracesSampleRate: 0.2 }),
      );
    });
  });

  it('envia o erro com a tag de contexto', () => {
    initMonitoring(DSN);

    captureError('tripsCache', new Error('disco cheio'));

    expect(sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { context: 'tripsCache' },
    });
  });

  it('converte valores que não são Error', () => {
    initMonitoring(DSN);

    captureError('sync', 'timeout');

    const [sent] = sentry.captureException.mock.calls[0];
    expect(sent).toBeInstanceOf(Error);
    expect(sent.message).toBe('timeout');
  });

  it('identifica o usuário só pelo id e limpa no logout', () => {
    initMonitoring(DSN);

    setMonitoringUser('user-1');
    setMonitoringUser(null);

    expect(sentry.setUser).toHaveBeenNthCalledWith(1, { id: 'user-1' });
    expect(sentry.setUser).toHaveBeenNthCalledWith(2, null);
  });

  it('logError repassa o erro ao monitoramento', () => {
    initMonitoring(DSN);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    logError('database', new Error('locked'));

    expect(sentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { context: 'database' },
    });
    consoleSpy.mockRestore();
  });
});
