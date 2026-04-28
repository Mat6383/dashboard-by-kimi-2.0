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
const auditService = require('../services/audit.service');

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
      auditService.log({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'rbac.denied',
        resource: 'auth',
        method: req.method,
        path: req.originalUrl || req.path,
        ip: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        statusCode: 403,
        details: { requiredRoles: allowedRoles },
        success: false,
      });
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
