/**
 * ================================================
 * AUDIT PRUNE JOB
 * ================================================
 * Nettoyage périodique des logs d'audit (rétention configurable).
 */

const logger = require('../services/logger.service');
const auditService = require('../services/audit.service');

const RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS, 10) || 90;
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

let timer = null;

function run() {
  try {
    auditService.prune(RETENTION_DAYS);
  } catch (err) {
    logger.error('AuditPruneJob: Erreur lors du pruning:', err.message);
  }
}

function start() {
  if (timer) return;
  // Run once at startup (delayed 30s to avoid competing with server boot)
  setTimeout(run, 30000);
  // Then every 24h
  timer = setInterval(run, INTERVAL_MS);
  logger.info(`AuditPruneJob: Démarré — rétention ${RETENTION_DAYS} jours`);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { start, stop, run };
