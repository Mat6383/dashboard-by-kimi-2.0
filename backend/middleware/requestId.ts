import { randomUUID } from 'crypto';

function requestIdMiddleware(req, res, next) {
  const id = req.get('x-request-id') || randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}

export default requestIdMiddleware;
module.exports = exports.default;
