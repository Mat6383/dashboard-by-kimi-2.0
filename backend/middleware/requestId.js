/**
 * Middleware de génération / propagation de Request ID (Correlation ID)
 * Permet de tracer une requête de bout en bout (frontend → backend → APIs externes)
 */

const { randomUUID } = require('crypto');

function requestIdMiddleware(req, res, next) {
  const id = req.get('x-request-id') || randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}

module.exports = requestIdMiddleware;
