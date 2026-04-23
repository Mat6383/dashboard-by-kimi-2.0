const express = require('express');
const router = express.Router();
const syncHistoryService = require('../services/syncHistory.service');
const commentsService = require('../services/comments.service');
const testmoService = require('../services/testmo.service');
const gitlabService = require('../services/gitlab.service');
const { getStats } = require('../services/apiTimer.service');

/**
 * Route de santé (Health Check)
 * DevOps: Monitoring et disponibilité
 */
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
  });
});

/**
 * GET /api/health/db
 * Vérifie la connectivité SQLite (sync-history + comments)
 */
router.get('/db', (req, res) => {
  const checks = {};
  let allOk = true;

  try {
    const db1 = syncHistoryService.db || syncHistoryService.initDb();
    const row1 = db1?.prepare('SELECT 1 AS ok').get();
    checks.syncHistory = { status: row1?.ok === 1 ? 'OK' : 'FAIL', responseTimeMs: 0 };
  } catch (err) {
    checks.syncHistory = { status: 'FAIL', error: 'Erreur interne' };
    allOk = false;
  }

  try {
    const db2 = commentsService.db || commentsService.init();
    const row2 = db2?.prepare('SELECT 1 AS ok').get();
    checks.comments = { status: row2?.ok === 1 ? 'OK' : 'FAIL', responseTimeMs: 0 };
  } catch (err) {
    checks.comments = { status: 'FAIL', error: 'Erreur interne' };
    allOk = false;
  }

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    checks,
  });
});

/**
 * GET /api/health/detailed
 * Health check complet : DB + APIs externes + stats temps de réponse
 */
router.get('/detailed', async (req, res) => {
  const checks = {};
  let allOk = true;

  // ─── DB checks ────────────────────────────────────────────────────────────
  const dbStart = Date.now();
  try {
    const db1 = syncHistoryService.db || syncHistoryService.initDb();
    const row1 = db1?.prepare('SELECT 1 AS ok').get();
    checks.syncHistory = {
      status: row1?.ok === 1 ? 'OK' : 'FAIL',
      responseTimeMs: Date.now() - dbStart,
    };
  } catch (err) {
    checks.syncHistory = { status: 'FAIL', error: err.message };
    allOk = false;
  }

  const db2Start = Date.now();
  try {
    const db2 = commentsService.db || commentsService.init();
    const row2 = db2?.prepare('SELECT 1 AS ok').get();
    checks.comments = {
      status: row2?.ok === 1 ? 'OK' : 'FAIL',
      responseTimeMs: Date.now() - db2Start,
    };
  } catch (err) {
    checks.comments = { status: 'FAIL', error: err.message };
    allOk = false;
  }

  // ─── External API checks ──────────────────────────────────────────────────
  const testmo = await testmoService.healthCheck();
  checks.testmoAPI = {
    status: testmo.ok ? 'OK' : 'FAIL',
    responseTimeMs: testmo.responseTimeMs,
    ...(testmo.error && { error: testmo.error }),
  };
  if (!testmo.ok) allOk = false;

  const gitlab = await gitlabService.healthCheck();
  checks.gitlabAPI = {
    status: gitlab.ok ? 'OK' : 'FAIL',
    responseTimeMs: gitlab.responseTimeMs,
    ...(gitlab.error && { error: gitlab.error }),
  };
  if (!gitlab.ok) allOk = false;

  // ─── Response time stats ──────────────────────────────────────────────────
  const apiStats = getStats();

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    checks,
    apiStats,
  });
});

module.exports = router;
