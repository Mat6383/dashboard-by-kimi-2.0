/**
 * ================================================
 * AUDIT ROUTES
 * ================================================
 * Endpoint admin pour consulter les logs d'audit.
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const auditService = require('../services/audit.service');

/**
 * GET /api/audit
 * Liste paginée des entrées d'audit (admin uniquement)
 */
router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  const filters = {
    action: req.query.action || undefined,
    actorId: req.query.actorId ? parseInt(req.query.actorId, 10) : undefined,
    from: req.query.from || undefined,
    to: req.query.to || undefined,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
    offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
  };

  const result = auditService.query(filters);
  res.json({ success: true, ...result });
});

module.exports = router;
