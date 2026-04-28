const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const syncHistoryService = require('../services/syncHistory.service');
const commentsService = require('../services/comments.service');
const testmoService = require('../services/testmo.service');
const gitlabService = require('../services/gitlab.service');
const { getStats } = require('../services/apiTimer.service');

/**
 * GET /api/health
 * Liveness probe — lightweight, no external calls
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    checks: { server: { status: 'OK' } },
  });
});

/**
 * Helper: run a DB check with actual response time measurement
 */
function checkDb(dbService, label) {
  const start = Date.now();
  try {
    if (!dbService.db) dbService.initDb ? dbService.initDb() : dbService.init();
    const db = dbService.db;
    const row = db?.prepare('SELECT 1 AS ok').get();
    return {
      status: row?.ok === 1 ? 'OK' : 'FAIL',
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    return { status: 'FAIL', error: err.message, responseTimeMs: Date.now() - start };
  }
}

/**
 * Helper: disk usage check
 */
function checkDisk() {
  try {
    const backendDir = path.resolve(__dirname, '..');
    const stat = fs.statfsSync(backendDir);
    const totalBytes = stat.blocks * stat.bsize;
    const freeBytes = stat.bavail * stat.bsize;
    const usedBytes = totalBytes - freeBytes;
    const usagePercent = totalBytes > 0 ? parseFloat(((usedBytes / totalBytes) * 100).toFixed(2)) : 0;
    return {
      status: 'OK',
      freeBytes,
      totalBytes,
      usagePercent,
    };
  } catch (err) {
    return { status: 'FAIL', error: err.message };
  }
}

/**
 * GET /api/health/ready
 * Readiness probe — DB + external APIs
 */
router.get('/ready', async (_req, res) => {
  const checks = {};
  let allOk = true;

  const db1 = checkDb(syncHistoryService, 'syncHistory');
  checks.syncHistoryDB = db1;
  if (db1.status !== 'OK') allOk = false;

  const db2 = checkDb(commentsService, 'comments');
  checks.commentsDB = db2;
  if (db2.status !== 'OK') allOk = false;

  const testmo = await testmoService.healthCheck({ timeout: 3000 });
  checks.testmoAPI = {
    status: testmo.ok ? 'OK' : 'FAIL',
    responseTimeMs: testmo.responseTimeMs,
    ...(testmo.error && { error: testmo.error }),
  };
  if (!testmo.ok) allOk = false;

  const gitlab = await gitlabService.healthCheck({ timeout: 3000 });
  checks.gitlabAPI = {
    status: gitlab.ok ? 'OK' : 'FAIL',
    responseTimeMs: gitlab.responseTimeMs,
    ...(gitlab.error && { error: gitlab.error }),
  };
  if (!gitlab.ok) allOk = false;

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    checks,
  });
});

/**
 * GET /api/health/detailed
 * Full diagnostics for human operators / admin UI
 */
router.get('/detailed', async (_req, res) => {
  const checks = {};
  let allOk = true;

  // DB checks
  const db1 = checkDb(syncHistoryService, 'syncHistory');
  checks.syncHistoryDB = db1;
  if (db1.status !== 'OK') allOk = false;

  const db2 = checkDb(commentsService, 'comments');
  checks.commentsDB = db2;
  if (db2.status !== 'OK') allOk = false;

  // External API checks
  const testmo = await testmoService.healthCheck({ timeout: 3000 });
  checks.testmoAPI = {
    status: testmo.ok ? 'OK' : 'FAIL',
    responseTimeMs: testmo.responseTimeMs,
    ...(testmo.error && { error: testmo.error }),
  };
  if (!testmo.ok) allOk = false;

  const gitlab = await gitlabService.healthCheck({ timeout: 3000 });
  checks.gitlabAPI = {
    status: gitlab.ok ? 'OK' : 'FAIL',
    responseTimeMs: gitlab.responseTimeMs,
    ...(gitlab.error && { error: gitlab.error }),
  };
  if (!gitlab.ok) allOk = false;

  // Disk check
  const disk = checkDisk();
  if (disk.status !== 'OK') allOk = false;

  // Memory
  const mem = process.memoryUsage();

  // API stats
  const apiStats = getStats();

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
    },
    disk,
    checks,
    apiStats,
  });
});

/**
 * GET /api/health/circuit-breakers
 * État des circuit breakers externes
 */
router.get('/circuit-breakers', (_req, res) => {
  const { testmoBreaker } = require('../services/testmo.service');
  const { gitlabBreaker } = require('../services/gitlab.service');
  const { statusSyncBreaker } = require('../services/status-sync.service');

  res.json({
    success: true,
    data: [testmoBreaker.getStatus(), gitlabBreaker.getStatus(), statusSyncBreaker.getStatus()],
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
