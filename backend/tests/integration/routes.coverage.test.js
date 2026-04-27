/**
 * Tests d'intégration — Routes sous-couvertes
 * Couvre featureFlags, runs, projects/*, crosstest/*, sync/*, reports/generate succès
 */

const request = require('supertest');
const app = require('../../server');

jest.mock('../../services/testmo.service', () => ({
  getRunDetails: jest.fn(() => Promise.resolve({ id: 1, name: 'R01' })),
  getRunResults: jest.fn(() => Promise.resolve([{ id: 101, status_id: 3, title: 'Test case 1' }])),
  getProjectRuns: jest.fn(() => Promise.resolve([{ id: 1, name: 'R01', is_completed: false }])),
  getProjectMilestones: jest.fn(() => Promise.resolve([{ id: 1, name: 'M1' }])),
  getAutomationRuns: jest.fn(() => Promise.resolve([{ id: 1, name: 'Auto-1' }])),
  getProjects: jest.fn(() => Promise.resolve({ result: [{ id: 1, name: 'Alpha' }] })),
  getProjectMetrics: jest.fn(() => Promise.resolve({})),
  apiGet: jest.fn((url) => {
    if (url && url.includes('/runs?limit=50')) {
      return Promise.resolve({ result: [{ id: 10, name: 'R01-run', milestone_id: 5 }] });
    }
    return Promise.resolve({ result: [] });
  }),
  healthCheck: jest.fn(() => Promise.resolve({ ok: true })),
  clearCache: jest.fn(() => true),
}));

jest.mock('../../services/gitlab.service', () => ({
  healthCheck: jest.fn(() => Promise.resolve({ ok: true })),
  searchIterations: jest.fn(() => Promise.resolve([{ id: 1, title: 'R01', state: 'active', web_url: 'http://gl/1' }])),
  getIssuesByLabelAndIterationForProject: jest.fn(() =>
    Promise.resolve([
      {
        iid: 1,
        title: 'Issue 1',
        web_url: 'http://gl/1',
        state: 'opened',
        assignees: [{ name: 'Alice' }],
        labels: ['CrossTest::OK', 'bug'],
        created_at: '2024-01-01T00:00:00Z',
        closed_at: null,
      },
    ])
  ),
}));

jest.mock('../../services/featureFlags.service', () => ({
  getAll: jest.fn(() => ({ darkMode: true, betaFeature: false })),
  isEnabled: jest.fn((key) => key === 'darkMode'),
  set: jest.fn(() => true),
}));

jest.mock('../../services/comments.service', () => ({
  getAll: jest.fn(() => ({
    1: { id: 1, issue_iid: 1, comment: 'Test comment', milestone_context: 'R01' },
  })),
  upsert: jest.fn((iid, comment, milestoneContext) => ({
    id: iid,
    issue_iid: iid,
    comment,
    milestone_context: milestoneContext,
  })),
  delete: jest.fn(() => true),
  init: jest.fn(),
}));

jest.mock('../../services/syncHistory.service', () => ({
  getHistory: jest.fn(() => [{ id: 1, project_name: 'Alpha', iteration_name: 'R01', mode: 'preview' }]),
  addRun: jest.fn(),
  initDb: jest.fn(),
  _initialized: true,
  db: null,
}));

jest.mock('../../services/auto-sync-config.service', () => ({
  getConfig: jest.fn(() => ({
    enabled: false,
    runId: null,
    iterationName: '',
    gitlabProjectId: '',
    version: '',
  })),
  updateConfig: jest.fn((patch) => ({
    enabled: false,
    runId: null,
    iterationName: '',
    gitlabProjectId: '',
    version: '',
    ...patch,
    updatedAt: new Date().toISOString(),
  })),
}));

jest.mock('../../services/report.service', () => {
  return jest.fn().mockImplementation(() => ({
    collectReportData: jest.fn(() =>
      Promise.resolve({
        milestoneName: 'R01',
        verdict: 'GO',
        stats: { totalTests: 100, passRate: 95 },
        failedTests: [],
      })
    ),
    generateHTML: jest.fn(() => '<html>report</html>'),
    generatePPTX: jest.fn(() =>
      Promise.resolve({
        write: jest.fn(() => Promise.resolve(Buffer.from('pptx'))),
      })
    ),
  }));
});

jest.mock('../../services/sync.service', () => ({
  previewIteration: jest.fn(() =>
    Promise.resolve({
      iteration: { id: 1, title: 'R01' },
      folder: { id: 10 },
      issues: [],
      summary: { toCreate: 1, toUpdate: 0, toSkip: 0, total: 1 },
    })
  ),
  syncIteration: jest.fn((iterationName, options, onEvent) => {
    if (onEvent) onEvent('done', { created: 1, updated: 0, skipped: 0 });
    return Promise.resolve({ created: 1, updated: 0, skipped: 0 });
  }),
  testTestmoApi: jest.fn(() => Promise.resolve({ success: true })),
  cleanupTestFolder: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('../../services/status-sync.service', () => ({
  syncRunStatusToGitLab: jest.fn((runId, iterationName, gitlabProjectId, onEvent, dryRun, version) => {
    if (onEvent) onEvent('done', { updated: 5 });
    return Promise.resolve();
  }),
}));

jest.mock('../../services/apiTimer.service', () => ({
  instrumentAxios: jest.fn(),
  getStats: jest.fn(() => ({
    testmo: { totalCalls: 0, errors: 0, avgResponseTimeMs: 0, p95ResponseTimeMs: 0, lastCallsCount: 0 },
  })),
}));

describe('Routes Coverage Integration Tests', () => {
  beforeAll(() => {
    process.env.ADMIN_API_TOKEN = 'test-admin-token';
  });

  afterAll(() => {
    delete process.env.ADMIN_API_TOKEN;
  });

  // ─── Feature Flags ─────────────────────────────────────────────────────────
  describe('GET /api/feature-flags', () => {
    it('returns all feature flags', async () => {
      const res = await request(app).get('/api/feature-flags').set('X-Admin-Token', 'test-admin-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('darkMode');
    });
  });

  describe('GET /api/feature-flags/:key', () => {
    it('returns a specific flag state', async () => {
      const res = await request(app).get('/api/feature-flags/darkMode').set('X-Admin-Token', 'test-admin-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({ key: 'darkMode', enabled: true });
    });
  });

  describe('PUT /api/feature-flags/:key', () => {
    it('updates a feature flag', async () => {
      const res = await request(app)
        .put('/api/feature-flags/darkMode')
        .set('X-Admin-Token', 'test-admin-token')
        .send({ enabled: false });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enabled).toBe(false);
    });

    it('returns 400 when enabled is not a boolean', async () => {
      const res = await request(app)
        .put('/api/feature-flags/darkMode')
        .set('X-Admin-Token', 'test-admin-token')
        .send({ enabled: 'yes' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Runs ──────────────────────────────────────────────────────────────────
  describe('GET /api/runs/:runId', () => {
    it('returns run details', async () => {
      const res = await request(app).get('/api/runs/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 1);
    });

    it('returns 400 for invalid runId', async () => {
      const res = await request(app).get('/api/runs/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/runs/:runId/results', () => {
    it('returns run results', async () => {
      const res = await request(app).get('/api/runs/1/results');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('accepts status filter query', async () => {
      const res = await request(app).get('/api/runs/1/results?status=3,5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Projects ──────────────────────────────────────────────────────────────
  describe('GET /api/projects/:projectId/runs', () => {
    it('returns project runs', async () => {
      const res = await request(app).get('/api/projects/1/runs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/projects/:projectId/milestones', () => {
    it('returns project milestones', async () => {
      const res = await request(app).get('/api/projects/1/milestones');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/projects/:projectId/automation', () => {
    it('returns automation runs', async () => {
      const res = await request(app).get('/api/projects/1/automation');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── Crosstest ─────────────────────────────────────────────────────────────
  describe('GET /api/crosstest/iterations', () => {
    it('returns iterations', async () => {
      const res = await request(app).get('/api/crosstest/iterations');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/crosstest/issues/:iterationId', () => {
    it('returns issues for iteration', async () => {
      const res = await request(app).get('/api/crosstest/issues/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('iid', 1);
    });

    it('returns 400 for invalid iterationId', async () => {
      const res = await request(app).get('/api/crosstest/issues/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/crosstest/comments/:iid', () => {
    it('updates a comment', async () => {
      const res = await request(app)
        .put('/api/crosstest/comments/1')
        .send({ comment: 'Updated', milestone_context: 'R02' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment).toBe('Updated');
    });

    it('returns 400 when comment is missing', async () => {
      const res = await request(app).put('/api/crosstest/comments/1').send({ milestone_context: 'R02' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/crosstest/comments/:iid', () => {
    it('deletes a comment', async () => {
      const res = await request(app).delete('/api/crosstest/comments/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deleted).toBe(true);
    });

    it('returns 400 for invalid iid', async () => {
      const res = await request(app).delete('/api/crosstest/comments/abc');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Sync ──────────────────────────────────────────────────────────────────
  describe('GET /api/sync/history', () => {
    it('returns sync history', async () => {
      const res = await request(app).get('/api/sync/history');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns 500 when getHistory throws', async () => {
      const syncHistory = require('../../services/syncHistory.service');
      syncHistory.getHistory.mockImplementationOnce(() => {
        throw new Error('DB locked');
      });
      const res = await request(app).get('/api/sync/history');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/sync/auto-config', () => {
    it('returns auto-sync config', async () => {
      const res = await request(app).get('/api/sync/auto-config');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('enabled');
    });
  });

  describe('GET /api/sync/:projectId/iterations', () => {
    it('returns iterations for a configured project', async () => {
      const res = await request(app).get('/api/sync/neo-pilot/iterations?search=R01');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns 404 for unknown project', async () => {
      const res = await request(app).get('/api/sync/unknown/iterations');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for non-configured project', async () => {
      const res = await request(app).get('/api/sync/kiosk/iterations');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 500 when searchIterations throws', async () => {
      const gitlab = require('../../services/gitlab.service');
      gitlab.searchIterations.mockRejectedValueOnce(new Error('GitLab down'));
      const res = await request(app).get('/api/sync/neo-pilot/iterations');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/sync/preview', () => {
    it('returns preview for a configured project', async () => {
      const res = await request(app).post('/api/sync/preview').send({ projectId: 'neo-pilot', iterationName: 'R01' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
    });

    it('returns 404 for unknown project', async () => {
      const res = await request(app).post('/api/sync/preview').send({ projectId: 'unknown', iterationName: 'R01' });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for non-configured project', async () => {
      const res = await request(app).post('/api/sync/preview').send({ projectId: 'kiosk', iterationName: 'R01' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 500 when previewIteration throws', async () => {
      const syncService = require('../../services/sync.service');
      syncService.previewIteration.mockRejectedValueOnce(new Error('Sync failed'));
      const res = await request(app).post('/api/sync/preview').send({ projectId: 'neo-pilot', iterationName: 'R01' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/sync/execute', () => {
    it('streams sync execution via SSE', async () => {
      const res = await request(app).post('/api/sync/execute').send({ projectId: 'neo-pilot', iterationName: 'R01' });
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    });

    it('returns 404 for unknown project', async () => {
      const res = await request(app).post('/api/sync/execute').send({ projectId: 'unknown', iterationName: 'R01' });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for non-configured project', async () => {
      const res = await request(app).post('/api/sync/execute').send({ projectId: 'kiosk', iterationName: 'R01' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('streams SSE error when syncIteration throws', async () => {
      const syncService = require('../../services/sync.service');
      syncService.syncIteration.mockRejectedValueOnce(new Error('Sync crash'));
      const res = await request(app).post('/api/sync/execute').send({ projectId: 'neo-pilot', iterationName: 'R01' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('"type":"error"');
    });
  });

  describe('POST /api/sync/iteration', () => {
    it('syncs an iteration', async () => {
      const res = await request(app).post('/api/sync/iteration').send({ iteration: 'R01 - run 1' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 500 when syncIteration throws', async () => {
      const syncService = require('../../services/sync.service');
      syncService.syncIteration.mockRejectedValueOnce(new Error('Sync failed'));
      const res = await request(app).post('/api/sync/iteration').send({ iteration: 'R01 - run 1' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/sync/status-to-gitlab', () => {
    it('streams status sync via SSE', async () => {
      const res = await request(app)
        .post('/api/sync/status-to-gitlab')
        .send({ runId: 1, gitlabProjectId: 63, iterationName: 'R01' });
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    });

    it('streams SSE error when syncRunStatusToGitLab throws', async () => {
      const statusSync = require('../../services/status-sync.service');
      statusSync.syncRunStatusToGitLab.mockRejectedValueOnce(new Error('Status sync crash'));
      const res = await request(app)
        .post('/api/sync/status-to-gitlab')
        .send({ runId: 1, gitlabProjectId: 63, iterationName: 'R01' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('"type":"error"');
    });
  });

  describe('POST /api/sync/test-api', () => {
    it('requires admin auth', async () => {
      const res = await request(app).post('/api/sync/test-api');
      expect(res.status).toBe(403);
    });

    it('runs testmo API test with admin token', async () => {
      const res = await request(app).post('/api/sync/test-api').set('X-Admin-Token', 'test-admin-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 500 when testTestmoApi throws', async () => {
      const syncService = require('../../services/sync.service');
      syncService.testTestmoApi.mockRejectedValueOnce(new Error('Testmo unreachable'));
      const res = await request(app).post('/api/sync/test-api').set('X-Admin-Token', 'test-admin-token');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/sync/test-cleanup', () => {
    it('requires admin auth', async () => {
      const res = await request(app).delete('/api/sync/test-cleanup');
      expect(res.status).toBe(403);
    });

    it('cleans up test folder with admin token', async () => {
      const res = await request(app).delete('/api/sync/test-cleanup').set('X-Admin-Token', 'test-admin-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 500 when cleanupTestFolder throws', async () => {
      const syncService = require('../../services/sync.service');
      syncService.cleanupTestFolder.mockRejectedValueOnce(new Error('Cleanup failed'));
      const res = await request(app).delete('/api/sync/test-cleanup').set('X-Admin-Token', 'test-admin-token');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/sync/auto-config', () => {
    it('updates auto-sync config', async () => {
      const res = await request(app).put('/api/sync/auto-config').send({ enabled: true, runId: 42 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enabled).toBe(true);
      expect(res.body.data.runId).toBe(42);
    });

    it('returns 400 when no valid fields provided', async () => {
      const res = await request(app).put('/api/sync/auto-config').send({ foo: 'bar' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 500 when updateConfig throws', async () => {
      const autoSync = require('../../services/auto-sync-config.service');
      autoSync.updateConfig.mockImplementationOnce(() => {
        throw new Error('Config write failed');
      });
      const res = await request(app).put('/api/sync/auto-config').send({ enabled: true });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Reports ───────────────────────────────────────────────────────────────
  describe('POST /api/reports/generate', () => {
    it('generates report successfully', async () => {
      const res = await request(app)
        .post('/api/reports/generate')
        .send({
          projectId: 1,
          runIds: [101],
          formats: { html: true, pptx: true },
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.files).toHaveProperty('html');
      expect(res.body.files).toHaveProperty('pptx');
      expect(res.body.summary).toHaveProperty('verdict', 'GO');
    });

    it('falls back to milestoneId when runIds empty', async () => {
      const res = await request(app)
        .post('/api/reports/generate')
        .send({
          projectId: 1,
          milestoneId: 5,
          formats: { html: true },
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Docs ────────────────────────────────────────────────────────────────────
  describe('GET /api/docs', () => {
    it('serves Swagger UI HTML', async () => {
      const res = await request(app).get('/api/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger-ui');
    });
  });

  // ─── Metrics ─────────────────────────────────────────────────────────────────
  describe('GET /metrics', () => {
    it('returns Prometheus metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('qa_dashboard_');
    });
  });
});
