import webhooksService from '../services/webhooks.service';

jest.mock('../services/syncHistory.service', () => ({
  _initialized: true,
  initDb: jest.fn(),
  db: {
    prepare: jest.fn().mockReturnThis(),
    run: jest.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
    get: jest.fn(),
    all: jest.fn().mockReturnValue([]),
  },
}));

describe('WebhooksService.emitMetricAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('envoie aux subscriptions metric.alert sans filtres', async () => {
    const mockSend = jest.spyOn(webhooksService as any, '_send').mockResolvedValue(undefined);
    jest.spyOn(webhooksService, 'getAll').mockReturnValue([
      { id: 1, url: 'http://hook1', events: ['metric.alert'], enabled: true, filters: null, secret: 'secret1' },
    ]);

    await webhooksService.emitMetricAlert('passRate', 'critical', 85, 90, 1, 'Alpha');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://hook1' }),
      'metric.alert',
      expect.objectContaining({ metric: 'passRate', severity: 'critical' })
    );
    mockSend.mockRestore();
  });

  test('filtre par métrique', async () => {
    const mockSend = jest.spyOn(webhooksService as any, '_send').mockResolvedValue(undefined);
    jest.spyOn(webhooksService, 'getAll').mockReturnValue([
      { id: 1, url: 'http://hook1', events: ['metric.alert'], enabled: true, filters: { metric: 'passRate' }, secret: 's1' },
      { id: 2, url: 'http://hook2', events: ['metric.alert'], enabled: true, filters: { metric: 'blockedRate' }, secret: 's2' },
    ]);

    await webhooksService.emitMetricAlert('passRate', 'critical', 85, 90, 1, 'Alpha');

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://hook1' }),
      'metric.alert',
      expect.anything()
    );
    mockSend.mockRestore();
  });

  test('filtre par sévérité', async () => {
    const mockSend = jest.spyOn(webhooksService as any, '_send').mockResolvedValue(undefined);
    jest.spyOn(webhooksService, 'getAll').mockReturnValue([
      { id: 1, url: 'http://hook1', events: ['metric.alert'], enabled: true, filters: { severity: 'warning' }, secret: 's1' },
      { id: 2, url: 'http://hook2', events: ['metric.alert'], enabled: true, filters: { severity: 'critical' }, secret: 's2' },
    ]);

    await webhooksService.emitMetricAlert('passRate', 'critical', 85, 90, 1, 'Alpha');

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://hook2' }),
      'metric.alert',
      expect.anything()
    );
    mockSend.mockRestore();
  });

  test('ignore les subscriptions non actives', async () => {
    const mockSend = jest.spyOn(webhooksService as any, '_send').mockResolvedValue(undefined);
    jest.spyOn(webhooksService, 'getAll').mockReturnValue([
      { id: 1, url: 'http://hook1', events: ['metric.alert'], enabled: false, filters: null, secret: 's1' },
    ]);

    await webhooksService.emitMetricAlert('passRate', 'critical', 85, 90, 1, 'Alpha');

    expect(mockSend).not.toHaveBeenCalled();
    mockSend.mockRestore();
  });

  test('ignore les subscriptions sans event metric.alert', async () => {
    const mockSend = jest.spyOn(webhooksService as any, '_send').mockResolvedValue(undefined);
    jest.spyOn(webhooksService, 'getAll').mockReturnValue([
      { id: 1, url: 'http://hook1', events: ['feature-flag.changed'], enabled: true, filters: null, secret: 's1' },
    ]);

    await webhooksService.emitMetricAlert('passRate', 'critical', 85, 90, 1, 'Alpha');

    expect(mockSend).not.toHaveBeenCalled();
    mockSend.mockRestore();
  });
});
