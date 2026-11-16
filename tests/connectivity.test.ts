import {
  getIsOnline,
  notifyBackOnline,
  notifyOffline,
  onBackOnline,
  subscribeConnectivity,
} from '@/services/connectivity';

describe('connectivity', () => {
  afterEach(() => {
    notifyBackOnline();
  });

  it('alterna entre offline e online e notifica só quando o estado muda', () => {
    const statusListener = jest.fn();
    const unsubscribe = subscribeConnectivity(statusListener);

    expect(getIsOnline()).toBe(true);

    notifyOffline();
    notifyOffline();
    expect(getIsOnline()).toBe(false);
    expect(statusListener).toHaveBeenCalledTimes(1);

    notifyBackOnline();
    expect(getIsOnline()).toBe(true);
    expect(statusListener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('onBackOnline dispara a cada round-trip, mesmo já estando online', () => {
    const backOnline = jest.fn();
    const unsubscribe = onBackOnline(backOnline);

    notifyBackOnline();
    notifyBackOnline();

    expect(backOnline).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
