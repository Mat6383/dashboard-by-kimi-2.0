/**
 * Middleware de logging des requêtes (ITIL Event Management)
 */

const logger = require('../services/logger.service');

function requestLogger(req, res, next) {
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
}

module.exports = requestLogger;
