const express = require('express');
const router = express.Router();
const featureFlagsService = require('../services/featureFlags.service');
const { safeErrorResponse } = require('../utils/errorResponse');
const { auditAction } = require('../middleware/audit.middleware');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const {
  validateParams,
  validateBody,
  featureFlagKeyParam,
  featureFlagCreateBody,
  featureFlagUpdateBody,
} = require('../validators');

/**
 * GET /api/feature-flags
 * Retourne tous les flags sous forme d'objet { [key]: boolean }.
 * Lecture publique — rétrocompatibilité consumer.
 */
router.get('/', (req, res) => {
  const flags = featureFlagsService.getAll();
  res.json({ success: true, data: flags, timestamp: new Date().toISOString() });
});

// ─── Admin routes ───────────────────────────────────────────────────────────
// GET /admin doit être déclaré AVANT GET /:key pour éviter que "admin"
// ne soit interprété comme un paramètre dynamique.

/**
 * GET /api/feature-flags/admin
 * Liste détaillée des flags (métadonnées complètes).
 * Admin uniquement.
 */
router.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const flags = featureFlagsService.getAllDetails();
    res.json({ success: true, data: flags, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json(safeErrorResponse(error, 'GET /api/feature-flags/admin'));
  }
});

/**
 * POST /api/feature-flags/admin
 * Crée un nouveau flag.
 * Admin uniquement.
 */
router.post(
  '/admin',
  requireAuth,
  requireRole('admin'),
  validateBody(featureFlagCreateBody),
  auditAction('feature-flag.create', { captureBody: true }),
  (req, res) => {
    const { key, enabled, description, rolloutPercentage } = req.body;
    try {
      const existing = featureFlagsService.getByKey(key);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: `Le flag "${key}" existe déjà`,
          timestamp: new Date().toISOString(),
        });
      }
      const ok = featureFlagsService.create(key, { enabled, description, rolloutPercentage });
      if (!ok) {
        return res.status(500).json({ success: false, error: 'Création échouée', timestamp: new Date().toISOString() });
      }
      res.status(201).json({
        success: true,
        data: featureFlagsService.getByKey(key),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json(safeErrorResponse(error, 'POST /api/feature-flags/admin'));
    }
  }
);

/**
 * PUT /api/feature-flags/admin/:key
 * Met à jour un flag existant.
 * Admin uniquement.
 */
router.put(
  '/admin/:key',
  requireAuth,
  requireRole('admin'),
  validateParams(featureFlagKeyParam),
  validateBody(featureFlagUpdateBody),
  auditAction('feature-flag.update', { captureParams: true, captureBody: true }),
  (req, res) => {
    const { key } = req.params;
    const { enabled, description, rolloutPercentage } = req.body;
    try {
      const existing = featureFlagsService.getByKey(key);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: `Flag "${key}" introuvable`,
          timestamp: new Date().toISOString(),
        });
      }
      const ok = featureFlagsService.update(key, { enabled, description, rolloutPercentage });
      if (!ok) {
        return res
          .status(500)
          .json({ success: false, error: 'Mise à jour échouée', timestamp: new Date().toISOString() });
      }
      res.json({
        success: true,
        data: featureFlagsService.getByKey(key),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json(safeErrorResponse(error, 'PUT /api/feature-flags/admin/:key'));
    }
  }
);

/**
 * DELETE /api/feature-flags/admin/:key
 * Supprime un flag.
 * Admin uniquement.
 */
router.delete(
  '/admin/:key',
  requireAuth,
  requireRole('admin'),
  validateParams(featureFlagKeyParam),
  auditAction('feature-flag.delete', { captureParams: true }),
  (req, res) => {
    const { key } = req.params;
    try {
      const existing = featureFlagsService.getByKey(key);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: `Flag "${key}" introuvable`,
          timestamp: new Date().toISOString(),
        });
      }
      const ok = featureFlagsService.delete(key);
      if (!ok) {
        return res
          .status(500)
          .json({ success: false, error: 'Suppression échouée', timestamp: new Date().toISOString() });
      }
      res.json({ success: true, deleted: true, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json(safeErrorResponse(error, 'DELETE /api/feature-flags/admin/:key'));
    }
  }
);

// ─── Routes publiques dynamiques (en dernier) ──────────────────────────────

/**
 * GET /api/feature-flags/:key
 * Retourne l'état d'un flag spécifique.
 * Lecture publique — rétrocompatibilité consumer.
 */
router.get('/:key', (req, res) => {
  const { key } = req.params;
  const enabled = featureFlagsService.isEnabled(key);
  res.json({ success: true, data: { key, enabled }, timestamp: new Date().toISOString() });
});

module.exports = router;
