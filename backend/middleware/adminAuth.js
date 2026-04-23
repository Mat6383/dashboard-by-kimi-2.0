/**
 * ================================================
 * ADMIN AUTH MIDDLEWARE
 * ================================================
 * Protège les endpoints sensibles (admin / maintenance)
 * via un token passé dans le header X-Admin-Token.
 *
 * Configuration : variable d'environnement ADMIN_API_TOKEN
 * Si non définie, les routes admin retournent 501 (Not Implemented)
 * pour éviter d'être exposées sans protection.
 */

const logger = require('../services/logger.service');

function requireAdminAuth(req, res, next) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    logger.warn('[AdminAuth] ADMIN_API_TOKEN non configuré — accès admin refusé');
    return res.status(501).json({
      success: false,
      error: 'Authentification admin non configurée sur ce serveur',
      timestamp: new Date().toISOString(),
    });
  }

  const provided = req.headers['x-admin-token'];
  if (!provided || provided !== adminToken) {
    logger.warn(`[AdminAuth] Tentative d'accès admin refusée (IP: ${req.ip})`);
    return res.status(403).json({
      success: false,
      error: 'Accès interdit — token admin invalide',
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

module.exports = requireAdminAuth;
