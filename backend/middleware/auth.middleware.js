/**
 * ================================================
 * AUTH & RBAC MIDDLEWARE
 * ================================================
 * Remplace requireAdminAuth pour les routes sensibles.
 * Supporte JWT via header Authorization: Bearer <token>
 * ou via cookie access_token.
 */

const jwtService = require('../services/auth/jwt.service');
const usersService = require('../services/users.service');
const logger = require('../services/logger.service');

function extractToken(req) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.slice(7);
  }
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise',
      timestamp: new Date().toISOString(),
    });
  }

  const payload = jwtService.verify(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Session expirée ou invalide',
      timestamp: new Date().toISOString(),
    });
  }

  const user = usersService.findById(payload.sub);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Utilisateur introuvable',
      timestamp: new Date().toISOString(),
    });
  }

  req.user = user;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise',
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`[RBAC] Accès refusé pour ${req.user.email} (rôle: ${req.user.role}) sur ${req.path}`);
      return res.status(403).json({
        success: false,
        error: 'Accès interdit — privilèges insuffisants',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

module.exports = { requireAuth, requireRole, extractToken };
