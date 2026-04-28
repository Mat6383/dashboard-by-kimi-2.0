const express = require('express');
const router = express.Router();
const featureFlagsService = require('../services/featureFlags.service');
const { safeErrorResponse } = require('../utils/errorResponse');
const { auditAction } = require('../middleware/audit.middleware');

/**
 * GET /api/feature-flags
 * Retourne tous les flags actifs
 */
router.get('/', (req, res) => {
  const flags = featureFlagsService.getAll();
  res.json({ success: true, data: flags, timestamp: new Date().toISOString() });
});

/**
 * GET /api/feature-flags/:key
 * Retourne l'état d'un flag spécifique
 */
router.get('/:key', (req, res) => {
  const { key } = req.params;
  const enabled = featureFlagsService.isEnabled(key);
  res.json({ success: true, data: { key, enabled }, timestamp: new Date().toISOString() });
});

/**
 * PUT /api/feature-flags/:key
 * Body: { enabled: boolean }
 */
router.put('/:key', auditAction('feature-flag.update', { captureParams: true }), (req, res) => {
  const { key } = req.params;
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ success: false, error: 'enabled doit être un booléen' });
  }
  try {
    const ok = featureFlagsService.set(key, enabled);
    if (!ok) {
      return res.status(500).json({ success: false, error: 'Mise à jour échouée' });
    }
    res.json({ success: true, data: { key, enabled }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'PUT /api/feature-flags/:key'));
  }
});

module.exports = router;
