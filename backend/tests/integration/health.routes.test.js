/**
 * Tests d'intégration des routes de health check
 */

const request = require('supertest');

jest.mock('../../services/logger.service', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Health Routes', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = 'test-secret';
    process.env.ADMIN_API_TOKEN = 'admin-test-token';
    app = require('../../server');
  });

  it('GET /api/health returns liveness probe', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.checks.server.status).toBe('OK');
    expect(res.body.uptime).toBeGreaterThan(0);
    expect(res.body.version).toBe('2.0.0');
  });

  it('GET /api/health/ready returns readiness probe with DB checks', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.checks.syncHistoryDB.status).toBe('OK');
    expect(res.body.checks.commentsDB.status).toBe('OK');
    expect(typeof res.body.checks.syncHistoryDB.responseTimeMs).toBe('number');
    expect(res.body.checks.syncHistoryDB.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/health/detailed returns full diagnostics', async () => {
    const res = await request(app).get('/api/health/detailed');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.memory).toBeDefined();
    expect(typeof res.body.memory.rss).toBe('number');
    expect(res.body.disk).toBeDefined();
    expect(res.body.disk.status).toBe('OK');
    expect(typeof res.body.disk.freeBytes).toBe('number');
    expect(typeof res.body.disk.totalBytes).toBe('number');
    expect(typeof res.body.disk.usagePercent).toBe('number');
    expect(res.body.apiStats).toBeDefined();
  });
});
